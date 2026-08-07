/**
 * Redis 限流（Upstash）
 *
 * 降级策略分两档（第四轮 P2）：
 * - 默认 **fail-closed**（BUG-R2-002）：Redis 不可用 → 拒绝。用于 AI 生成类端点 ——
 *   限流是 AI 成本的最后一道闸（尤其 `ai_bazi_guest` / `ai_tarot_guest` 这种 1 次/天的游客配额，
 *   一旦放开就是无认证的免费刷模型），Redis 挂时宁可 503 也不能让成本失控。
 * - 显式传 `{ failOpen: true }` → **回落到进程内限流 + 告警日志**：用于零成本端点（纯本地排盘、
 *   缓存命中读、鉴权前的轻量校验）。这些端点不该因为美东的 Redis 抖动就整站 503。
 *   注意 failOpen **不等于无限放行**：这些端点仍在烧 CPU（computeLifeKline 实测每请求
 *   27~44ms 同步阻塞），无上限会把它们变成打击面，所以降级时改用本实例内存计数兜底
 *   （阈值放宽到 Redis 限额 3 倍，只挡「无上限」不做精确配额）。
 *
 * ⚠️ 默认值必须保持 fail-closed：现有调用方一个都没改，行为与本轮之前完全一致。
 *    新端点接入时才需要判断「我是不是零成本」，是才传 failOpen。
 *
 * 另：本模块所有 Redis 调用都走 redisUserPath（期限 1.5s + 进程内分级闸门），
 * 不再可能出现「用户干等 4.3s 重试链才拿到 503」。
 *
 * 本模块是**唯一**配 tier:'critical' 的调用方：它的失败会直接拒绝真实用户，
 * 因此不接受被 best-effort 调用方（缓存读、熔断记账）的超时连累（见 redis.ts 的分级模型）。
 *
 * ════════════════════════════════════════════════════════════════════════
 * 运维须知：Redis 故障时的对外表现 & 告警怎么配（第五轮 P1，务必读完再配告警）
 * ════════════════════════════════════════════════════════════════════════
 *
 * 【现状（本轮结束时）】所有 route 都只看 `rl.allowed`，把 false 一律映射成
 *   429「请求过于频繁」。而 fail-closed 降级返回的正是 `allowed:false`。
 *   ⇒ **Redis 挂掉在监控里长得跟「用户在刷接口」一模一样：429 尖峰，5xx 曲线纹丝不动。**
 *   只按 5xx 率配的告警会 100% 漏报；用户看到的文案也是错的（说他请求太频繁，
 *   实际是我们自己的依赖挂了）。
 *
 * 【所以现在唯一可靠的告警源是日志串，不是状态码】按固定前缀配日志告警：
 *   - `[rate-limit][ALERT]`  ← 本文件 logDegrade()：限流器进入降级（区分放行/拒绝两种文案）
 *   - `[Redis][ALERT]`       ← redis.ts tripGate()：某关键级连续 3 次超时、闸门打开
 *   两条都做了节流（本文件 10s 一行 + 抑制计数），不会把日志刷爆，但只要故障持续
 *   就一定会周期性出现 —— 适合配「5 分钟内出现 ≥1 次」这种低阈值规则。
 *   黑盒补充：`/api/health` 在 Redis ping 失败时返回 503 + checks.redis='degraded'，
 *   可以直接拿它当外部探活，不依赖日志管道。
 *
 * 【下一轮 route 接入 rateLimitResponse()/enforceRateLimit() 之后】
 *   降级会变成 **503 + Retry-After**，限流仍是 429。届时：
 *   - 可以把主告警改回「5xx 率」，语义终于对齐；
 *   - 429 尖峰重新恢复它本来的含义 —— 真的有人在刷，该去看是谁；
 *   - 前端/客户端可据 Retry-After 决定退避，不再对着一个假 429 疯狂重试。
 *
 * 【Upstash 迁移窗口（iad1 → sin1，免费套餐只能先删后建，约 10-15 分钟无 Redis）预期】
 *   - 未传 failOpen 的端点（AI 生成类）：全部降级拒绝 —— 现在是 429、下一轮是 503。这是**故意的**，
 *     限流是 AI 成本的最后一道闸，宁可拒服务也不能在无认证情况下放开免费刷模型。
 *   - 传了 `{ failOpen: true }` 的零成本端点（纯本地排盘等）：照常服务，限流强度降为
 *     「每实例内存计数、阈值 3 倍放宽」——正常用户无感，极端刷量仍会被单实例挡住。
 *   - 迁移期间会有大量 `[rate-limit][ALERT]` 日志，属预期噪音；真正要盯的是它**没有**在
 *     迁移结束后消失 —— 那说明新库的连通性有问题。
 */

import { after } from 'next/server';
import { getRedis, isTierDown, redisUserPath, REDIS_DOWN_COOLDOWN_MS } from '@/lib/cache/redis';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reason?: string;
  /**
   * true = 本次结论不是真实计数，而是 Redis 不可用时的降级判定。
   *
   * ⚠️ `allowed:false` **有两种截然不同的含义**，只看 allowed 一定会把它们混为一谈：
   *   - degraded 不为 true → 用户真的超了限额 → 429
   *   - degraded === true  → 我们自己的依赖挂了，跟用户行为无关 → 503
   * 不要在 route 里手写这个分支判断，直接用下面的 rateLimitResponse() / enforceRateLimit()。
   */
  degraded?: boolean;
};

// 降级日志节流：Upstash 一挂就是全站每个请求一行，Vercel 日志按量计费且会淹没排查视线。
// 10s 一行 + 抑制条数，既留下可告警的固定串，又不刷屏。
const ALERT_INTERVAL_MS = 10_000;
let lastAlertAt = 0;
let suppressedSinceAlert = 0;

function logDegrade(failOpen: boolean, prefix: string, reason: string): void {
  const now = Date.now();
  if (now - lastAlertAt < ALERT_INTERVAL_MS) {
    suppressedSinceAlert += 1;
    return;
  }
  const suppressed = suppressedSinceAlert;
  lastAlertAt = now;
  suppressedSinceAlert = 0;
  const tail = suppressed > 0 ? `（另有 ${suppressed} 次同类降级被节流）` : '';
  if (failOpen) {
    // fail-open 期间限流形同虚设 —— 这行必须能被日志告警规则匹配到
    console.warn(`[rate-limit][ALERT] Redis 不可用(${reason})，零成本端点 ${prefix} 放行降级${tail}`);
  } else {
    console.error(`[rate-limit][ALERT] Redis 不可用(${reason})，拒绝 ${prefix} 请求（fail-closed）${tail}`);
  }
}

// ── 降级路径的进程内兜底限流 ─────────────────────────────────────────────
// failOpen 不等于「无限放行」。被它保护的端点虽然零 AI 成本，但仍在烧 CPU：
// computeLifeKline 实测每请求 27~44ms **同步阻塞**，calculateBazi 同量级。
// Redis 不可用期间无上限放行 = 把这些端点变成 CPU 打击面，反而可能拖垮整个实例。
// 所以降级时回落到「本实例内存计数」——保护强度弱于 Redis（Vercel 实例数不受控，
// 每实例各算各的），但足以挡住单点刷量，且零外部依赖、失败不了。
// 阈值刻意放宽到 Redis 限额的 3 倍：宁可宽松也别在故障期误伤真实用户，
// 我们要挡的是「无上限」，不是精确配额。
const MEM_BUCKET_MAX_KEYS = 5000; // 防内存无界增长；超出即整体清空（降级期短，可接受）
const memBuckets = new Map<string, number[]>();

function memAllow(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  if (memBuckets.size > MEM_BUCKET_MAX_KEYS) memBuckets.clear();
  const hits = (memBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit * 3) {
    memBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  memBuckets.set(key, hits);
  return true;
}

function degrade(
  prefix: string,
  limit: number,
  failOpen: boolean,
  reason: string,
  key?: string,
  windowSeconds?: number,
): RateLimitResult {
  logDegrade(failOpen, prefix, reason);
  if (!failOpen) {
    return { allowed: false, remaining: 0, reason: 'service_unavailable', degraded: true };
  }
  // key/windowSeconds 缺省时退回旧的无条件放行（不应发生，留作类型层面的兜底）
  const allowed = key && windowSeconds ? memAllow(key, limit, windowSeconds) : true;
  return allowed
    ? { allowed: true, remaining: limit, degraded: true }
    : { allowed: false, remaining: 0, reason: 'service_unavailable', degraded: true };
}

// ── 超时退款（第五轮修复 MAJOR-2）────────────────────────────────────────
// 问题：redisUserPath 的期限只是 Promise.race，**底层 INCR 不会被取消**，重试链继续跑完，
//   计数多半照样落库（redis.ts 的注释也明说依赖这一点）。对限流器而言这是反的：
//   我们已经按降级策略拒了这次请求（fail-closed → 503），用户的额度却被扣掉了。
//   长窗口配额尤其致命：ai_bazi_guest / ai_tarot_guest 是 1 次/天 ——
//   一次抖动就把这个游客当天的额度吃光，而他连一个字的解读都没拿到。
//
// 方案选型：
//   (a) 降级路径补一次 DECR ✅（本实现）
//   (b) 改「先 GET 后 INCR」❌：丢掉原子性（两个并发请求会读到同一个计数，双双放行，
//       正是 pipeline 原子 INCR 当初要解决的问题），还多一次 268ms 跨区往返。
//   (c) 换 sorted-set 滑动窗（ZADD 成员 + ZREM 撤销）❌：写是幂等了，但要多带成员、多几条命令，
//       为一个降级路径把主链路复杂度和往返数都抬上去，不划算。
//
// (a) 的并发安全论证 —— 关键在「等 INCR 真的落库了再退」，而不是超时后立刻盲发 DECR：
//   1. 只在 attempt.pending 兑现为 landed:true 时才发退款。因此不存在
//      「DECR 先到、INCR 后到」的乱序（DECR 是在 INCR 的 HTTP 响应之后才发出的），
//      也就不会出现「键先被 DECR 建成 -1 且无 TTL → 永久负计数/永久 429」这种脏状态。
//   2. INCR 最终失败（重试链耗尽）→ pending 是 landed:false → 一分钱都不退，
//      不会把没扣过的额度也退掉（避免「超时反而变成免费加量」的反向漏洞）。
//   3. 退款脚本用 EVAL 做「存在才 DECR」：键若已随窗口过期就什么都不做，绝不重建键。
//      唯一残留竞态是「旧窗口过期 + 新窗口恰在这几毫秒内被新请求建键」→ 退到新窗口头上，
//      多给 1 次额度。窗口 ≥600s 而退款发生在 INCR 落库后的毫秒级，概率可忽略，且方向上
//      只会多给一次、不会误伤用户。
//   4. 同一用户多个并发请求各自超时 → 各自 +1/-1，互不干扰（都是同键上的原子增减）。
//   5. 只在 **fail-closed 且我们真的拒了** 时退款。fail-open 放行了请求，这一次本来就该计数，
//      退了反而会让限流形同虚设。
const REFUND_SCRIPT = `if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end
return 0`;
// 只给长窗口退款。短窗口（如 10 次/分）本身几十秒内就自愈，为它把函数实例多留几秒
// 反而会在 Upstash 大面积抖动时推高并发占用；而 3600s / 86400s 的游客配额丢一次就是丢一天。
const REFUND_MIN_WINDOW_S = 600;
// 等 INCR 落定的上限。正常重试链 ≈4.3s 内必定 settle，但那是「Redis 还活着、只是慢」的场景；
// 真正全挂时我们已经在下面用 isTierDown 提前放弃，不会走到这里空等。故取 2.5s 即可覆盖
// 「抖动中但仍能落库」这唯一值得等的情形，同时不把函数实例长时间拖在 waitUntil 里。
const REFUND_WAIT_MS = 2500;

function scheduleRefund(
  pending: Promise<{ landed: boolean }>,
  key: string,
  prefix: string,
): void {
  const task = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const giveUp = new Promise<{ landed: false }>((resolve) => {
      timer = setTimeout(() => resolve({ landed: false }), REFUND_WAIT_MS);
    });
    try {
      // pending 永不 reject（redis.ts 已把 rejection 转成 landed:false）
      const settled = await Promise.race([pending, giveUp]);
      if (!settled.landed) return; // INCR 没落库（或等不及了）→ 没有账要退
      const r = getRedis();
      if (!r) return;
      // 退款本身也走有界期限：裸 eval 会用满默认重试链（≈4.3s），而这是后台任务，
      // 卡在 waitUntil 里只会白占实例时长。退不成就退不成，回到「超时照扣」的老行为。
      await redisUserPath('rate-limit:refund', () => r.eval(REFUND_SCRIPT, [key], []));
      console.warn(`[rate-limit] ${prefix} 超时后 INCR 仍落库，已退回 1 次配额`);
    } catch (err) {
      // 退款失败只是回到「超时照扣」的老行为，不能反过来影响任何东西
      console.warn(`[rate-limit] ${prefix} 配额退款失败:`, err);
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    // after() 在 Vercel 上映射到 waitUntil：响应已经返回，但实例不会被立刻冻结，
    // 退款得以真正发出去。不用 after() 的话，503 返回后实例多半立即冻结，退款石沉大海。
    after(task);
  } catch {
    // 非 Next 请求上下文（单测宿主 / 脚本调用）after() 会同步抛错：退回游离 Promise，
    // 能不能跑完看运行时，失败也只是回到「超时照扣」的老行为
    void task();
  }
}

export async function checkRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  // failOpen：零成本端点可选放行降级（Redis 挂了宁可放行也不 503）；默认 fail-closed 保护 AI 成本
  opts?: { failOpen?: boolean },
): Promise<RateLimitResult> {
  const failOpen = opts?.failOpen === true;
  const key = `rl:${prefix}:${identifier}`;

  // pipeline 单次 REST 往返完成 incr+expire。原两步写法有两个问题：
  // 1) 两次跨区往返；2) incr 成功后 expire 失败 → key 永无 TTL → 该用户/IP 永久 429。
  // expire 带 NX（仅无 TTL 时设置）：既覆盖新建 key，也自愈历史泄漏的无 TTL key。
  const attempt = await redisUserPath(
    `rate-limit:${prefix}`,
    (r) => r.pipeline().incr(key).expire(key, windowSeconds, 'nx').exec<[number, 0 | 1]>(),
    { tier: 'critical' },
  );

  if (!attempt.ok) {
    if (
      attempt.reason === 'timeout' &&
      !failOpen &&
      windowSeconds >= REFUND_MIN_WINDOW_S &&
      // Redis 已被判定不可达时，pending 必然 landed:false、退款脚本也发不出去 ——
      // 排这个任务只会让每个被拒请求在 waitUntil 里空耗一遍。等它恢复后自然重新开始退。
      !isTierDown('critical')
    ) {
      // 我们即将拒掉这次请求，就不能同时扣人家的额度
      scheduleRefund(attempt.pending, key, prefix);
    }
    // unconfigured / short_circuit / timeout / error 一律按「拿不到真实计数」处理
    return degrade(prefix, limit, failOpen, attempt.reason, key, windowSeconds);
  }

  const count = Number(attempt.value?.[0]);
  if (!Number.isFinite(count)) {
    // 应答格式异常（理论上不该发生）：按拿不到计数走同一套降级策略，
    // 而不是让 `undefined <= limit` 静默判 false —— 那会在 fail-open 端点上也变成拒绝
    return degrade(prefix, limit, failOpen, 'malformed_response', key, windowSeconds);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}

// ══════════════════════════════════════════════════════════════════════
// 把「限流」和「降级」在 HTTP 层分开（第五轮 P1）
// ══════════════════════════════════════════════════════════════════════
//
// 为什么要在 lib 层提供成品 Response，而不是只把 degraded 标志做得更显眼：
//   实证是「所有 17 个调用点无一例外都只看 allowed」—— 一个需要调用方主动想起来的标志位，
//   哪怕类型上再花哨，也会被下一个复制粘贴的人再忽略一次。真正治本的是**让正确映射
//   变成比手写更省事的那条路**：两行 if 换成一行 `if (denied) return denied;`，
//   而这一行里根本没有 429/503 的选择权可犯错。
//
// 为什么不用「抛异常 + 全局错误边界」那种更强的强制形态：
//   App Router 的每个 route 是独立导出函数，没有共享 catch；要么每个 route 包一层 try，
//   要么改造成高阶函数包装器 —— 而这些 route 的前置逻辑各不相同（先取 session 决定用
//   用户 ID 还是 IP、不同 prefix、流式响应……），统一包装器会逼着重构 17 个不同形状的入口。
//   对一个「把状态码修对」的改动来说，代价远超收益。Response|null 是 Next 生态里的惯用形态。
//
// 残留的误用面（诚实记录）：调用方可以完全不调用这个 helper。类型系统救不了「没写的代码」，
//   所以配套手段是上面那段运维须知里的日志告警 —— 即使 route 忘了接，故障也不会静默。

/** 降级 503 的机器可读码。前端/客户端据此区分「你太快了」和「我们挂了」。 */
export const DEGRADED_ERROR_CODE = 'SERVICE_UNAVAILABLE';

/**
 * 降级 503 建议的重试间隔（秒）。取值论证：
 *
 * 下限 = redis.ts 的不可达冷却窗（REDIS_DOWN_COOLDOWN_MS，当前 5s）。在这个窗口内重试，
 *   客户端拿不到任何新信息：本实例要么硬短路、要么只用 750ms 的 verify 槽再撞一次，
 *   结论大概率还是降级。比冷却窗更短的 Retry-After 等于**明知无效还请客户端再来一次**。
 * 实际取 max(30, 冷却窗×2)：
 *   - 真实故障的时间尺度远大于 5s。这次 Upstash 迁移窗就是 10-15 分钟，
 *     按 5s 重试意味着每个客户端在窗口内打 ~180 次 —— 每次都要跑满 verify 期限、
 *     每次都是一个 Vercel 函数调用，纯烧钱且毫无用处。30s 把这个数压到 ~30 次。
 *   - 又不能太长：Redis 恢复是秒级事件（探针一通就全放行），Retry-After 配成几分钟
 *     会让用户在服务早已恢复后继续干等。30s 是「不制造重试风暴」与「恢复后尽快可用」的折中。
 *   - 冷却窗若被调大，这个值自动跟着走（×2），不会悄悄退化成「短于冷却窗」的无效建议。
 * 注意：本值是**不带抖动**的固定值。当前客户端是人点按钮，不存在同步重试波；
 *   将来若给前端加自动重试，抖动必须加在客户端（服务端对所有人返回同一个数，
 *   在服务端加随机反而会让日志和用户预期都变得难以解释）。
 */
export const DEGRADED_RETRY_AFTER_S = Math.max(30, Math.ceil(REDIS_DOWN_COOLDOWN_MS / 1000) * 2);

// 现有 17 个调用点里有 13 个用的就是这个 429 体。把它设成默认值，
// 下一轮迁移时这些 route 是**零响应体变化**的纯机械替换，前端不需要跟着改。
const DEFAULT_LIMITED_BODY: Record<string, unknown> = { error: '请求过于频繁，请稍后再试' };
// 503 体同时给人看的文案和机器读的码：文案沿用 bazi/chat 里既有的 503 措辞，保持全站一致。
const DEFAULT_DEGRADED_BODY: Record<string, unknown> = {
  error: '服务暂时不可用，请稍后重试',
  code: DEGRADED_ERROR_CODE,
};

export type RateLimitResponseInit = {
  /** 覆盖 429 响应体。**保持各 route 现有 JSON 形状**用它（如 tarot 的 RATE_LIMITED / GUEST_LIMIT_REACHED）。 */
  limitedBody?: Record<string, unknown>;
  /** 覆盖 503 响应体。一般不用改；改了记得保留 code 字段供告警/客户端识别。 */
  degradedBody?: Record<string, unknown>;
  /**
   * 429 的 Retry-After（秒）。enforceRateLimit 会自动填 windowSeconds ——
   * 固定窗计数器算不出「本窗还剩多久」（要多一次跨区 TTL 查询，268ms，不值），
   * 用整窗长度是安全的**高估**：客户端等久一点顶多晚一点成功，等短了才会白撞一次 429。
   * 不传则不发这个头（宁可不给，也不瞎猜一个数）。
   */
  retryAfterSeconds?: number;
};

/**
 * 把 checkRateLimit 的结果翻译成正确的 HTTP 响应。
 *
 * 返回 null = 放行（含 fail-open 的降级放行），调用方继续走正常逻辑；
 * 返回 Response = 该直接 return 给客户端：真超限 → 429，Redis 降级 → 503 + Retry-After。
 *
 * 用法（下一轮 route 改造）：
 *   const rl = await checkRateLimit('ai_ziwei', session.user.id, 10, 60);
 *   const denied = rateLimitResponse(rl, { retryAfterSeconds: 60 });
 *   if (denied) return denied;
 *
 * 已经有 rl 且还要用 rl.remaining 的场景用这个；否则优先用 enforceRateLimit（少一个中间变量）。
 */
export function rateLimitResponse(rl: RateLimitResult, init: RateLimitResponseInit = {}): Response | null {
  if (rl.allowed) return null;

  // no-store：这两种响应都是**瞬时状态**，被任何中间层（CDN / 浏览器 bfcache）缓存住
  // 都会让用户在限额重置或 Redis 恢复之后仍然吃到旧的拒绝。
  if (rl.degraded === true) {
    return Response.json(init.degradedBody ?? DEFAULT_DEGRADED_BODY, {
      status: 503,
      headers: {
        'Retry-After': String(DEGRADED_RETRY_AFTER_S),
        'Cache-Control': 'no-store',
      },
    });
  }

  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  const retry = init.retryAfterSeconds;
  if (typeof retry === 'number' && Number.isFinite(retry) && retry > 0) {
    // Retry-After 只接受整数秒（RFC 9110），小数/0 都是无效头
    headers['Retry-After'] = String(Math.max(1, Math.ceil(retry)));
  }
  return Response.json(init.limitedBody ?? DEFAULT_LIMITED_BODY, { status: 429, headers });
}

/**
 * checkRateLimit + rateLimitResponse 的一步到位版本 —— **route 首选**。
 *
 * 调用方拿不到原始结果，也就没机会把降级误判成限流：
 *   const denied = await enforceRateLimit('ai_ziwei', session.user.id, 10, 60);
 *   if (denied) return denied;
 *
 * 需要保留原有 429 文案时传 limitedBody；零成本端点（纯本地排盘）传 { failOpen: true }。
 * Retry-After 默认取 windowSeconds，可用 retryAfterSeconds 覆盖。
 */
export async function enforceRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  opts: { failOpen?: boolean } & RateLimitResponseInit = {},
): Promise<Response | null> {
  const rl = await checkRateLimit(prefix, identifier, limit, windowSeconds, {
    failOpen: opts.failOpen,
  });
  return rateLimitResponse(rl, {
    limitedBody: opts.limitedBody,
    degradedBody: opts.degradedBody,
    retryAfterSeconds: opts.retryAfterSeconds ?? windowSeconds,
  });
}

/**
 * Redis 限流（Upstash）
 *
 * 降级策略分两档（第四轮 P2）：
 * - 默认 **fail-closed**（BUG-R2-002）：Redis 不可用 → 拒绝。用于 AI 生成类端点 ——
 *   限流是 AI 成本的最后一道闸（尤其 `ai_bazi_guest` / `ai_tarot_guest` 这种 1 次/天的游客配额，
 *   一旦放开就是无认证的免费刷模型），Redis 挂时宁可 503 也不能让成本失控。
 * - 显式传 `{ failOpen: true }` → **fail-open + 告警日志**：用于零成本端点（纯本地排盘、
 *   缓存命中读、鉴权前的轻量校验）。这些端点即使被刷也只烧 CPU，不该因为美东的 Redis 抖动
 *   就让整站排盘 503。
 *
 * ⚠️ 默认值必须保持 fail-closed：现有调用方一个都没改，行为与本轮之前完全一致。
 *    新端点接入时才需要判断「我是不是零成本」，是才传 failOpen。
 *
 * 另：本模块所有 Redis 调用都走 redisUserPath（期限 1.5s + 进程内分级闸门），
 * 不再可能出现「用户干等 4.3s 重试链才拿到 503」。
 *
 * 本模块是**唯一**配 tier:'critical' 的调用方：它的失败会直接拒绝真实用户，
 * 因此不接受被 best-effort 调用方（缓存读、熔断记账）的超时连累（见 redis.ts 的分级模型）。
 */

import { after } from 'next/server';
import { getRedis, isTierDown, redisUserPath } from '@/lib/cache/redis';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reason?: string;
  /** true = 本次结论不是真实计数，而是 Redis 不可用时的降级判定（调用方可据此埋点/放宽提示） */
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

function degrade(prefix: string, limit: number, failOpen: boolean, reason: string): RateLimitResult {
  logDegrade(failOpen, prefix, reason);
  return failOpen
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
    return degrade(prefix, limit, failOpen, attempt.reason);
  }

  const count = Number(attempt.value?.[0]);
  if (!Number.isFinite(count)) {
    // 应答格式异常（理论上不该发生）：按拿不到计数走同一套降级策略，
    // 而不是让 `undefined <= limit` 静默判 false —— 那会在 fail-open 端点上也变成拒绝
    return degrade(prefix, limit, failOpen, 'malformed_response');
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}

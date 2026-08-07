/**
 * Upstash Redis 客户端（Vercel 集成）
 * 用于八字分析和每日运势的持久化缓存
 * 环境变量缺失时优雅降级，不阻塞主流程
 */

// ── 区域事实（第四轮：生产实测 + Vercel 控制台存储元数据，权威，勿再靠 IP 反推）──────────
// 函数：Vercel hkg1（香港）
// Prisma Postgres：主区 sin1（新加坡）→ 实测往返约 35ms，健康，不是瓶颈
// Upstash Redis：主区 **iad1（美东弗吉尼亚）** → 实测往返约 268ms
//
// ⚠️ 订正上一轮的错误推断：本文件原写「Upstash 在 AWS ap-northeast-1（东京）」是错的 ——
//   那是从端点 IP 反查得来的，而 IP 是本地代理在 SF 解析到的边缘节点，不代表数据库主区。
//   Vercel 存储元数据里的 primaryRegion=iad1 才是权威来源。
// ⇒ 268ms 的支配项是「香港 ↔ 美东跨太平洋物理距离」（光纤单程就 ~80ms，再加骨干绕行与
//   TLS 之外的协议开销），**不是握手、也不是可调参数**。客户端配置层没有 268ms 可省。
//   能做的只有两件事：
//   a) 压往返条数 —— pipeline 合并（见 rate-limit.ts / ai/circuitBreaker.ts / ai/observe.ts）；
//   b) 给用户路径上的等待封顶 —— 见本文件下方 redisUserPath()。
//   （真想把 268ms 变成 5ms 只有一条路：把 Upstash 数据库迁到 ap-* 区或加只读副本，
//     那是基础设施决策，不在代码层。）
//
// ── 连接复用调查结论（勿再重复踩坑）────────────────────────────────────────
// 268ms 一度被怀疑是「每条 REST 命令都重新 TCP+TLS 握手」。实测结论：不是。
//
// 1) Node 的全局 fetch（内建 undici）默认就用带连接池的 Agent，同进程内连续请求复用同一条 TLS 连接。
//    本地实测（node v26，diagnostics_channel 计数）：5 次串行 fetch 同源 → undici:client:connected 只触发 1 次，
//    耗时 720ms / 201 / 203 / 208 / 250 —— 首次含握手，其后只剩 RTT。
//    因此 268ms 的采样是「每次都是冷连接的首命令」，不能证明命令级握手。
// 2) @upstash/redis 1.37 的 `agent` 选项在这里是死配置：它被塞进 fetch init 的 `agent` 字段，
//    而 WHATWG fetch/undici 只认 `dispatcher`，`agent` 被直接忽略（实测加不加，连接数都是 1）。
//    别为了「提速」去传 https.Agent，那只是自我安慰。
// 3) 想真正调连接池只能换全局 dispatcher（setGlobalDispatcher）。两条硬拦路：
//    a. undici 不是本项目依赖，Node 也不对外暴露内建副本，代码里根本 require 不到；
//    b. 全局 dispatcher 是全站副作用，AI 上游是流式长连接（bazi/stream、tarot SSE 透传），
//       keepAlive/headers/body 超时配错会把健康长流掐断 —— BLOCKER 级事故，收益远不抵风险。
// ⇒ 结论：客户端配置层无可优化。降低 Upstash 成本的唯一手段是「减少往返次数」（pipeline/合并），
//    见 rate-limit.ts、ai/circuitBreaker.ts、ai/observe.ts 的批量化写法。
//
// 附带须知：undici 默认 keepAliveTimeout 仅 4s。一次 AI 调用要等上游 20~60s，
// 这期间 Redis 连接必然被回收，所以「AI 之后的那批 Redis 写」注定要重新握手一次。
// 这更说明该压的是往返条数：同一批里第一条付握手，剩下的才只付 RTT。
// ──────────────────────────────────────────────────────────────────────

import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;
let _redisError: string | null = null;

function createRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

  if (!url || !token) {
    _redisError = 'Redis 环境变量未配置 (KV_REST_API_URL / UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)';
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (err: any) {
    _redisError = `Redis 初始化失败: ${err.message}`;
    return null;
  }
}

export function getRedis(): Redis | null {
  if (!_redis && !_redisError) {
    _redis = createRedis();
    if (_redis) console.log('[Redis] 客户端初始化成功');
    else if (_redisError) console.warn('[Redis]', _redisError);
  }
  return _redis;
}

// 兼容旧代码：直接 import { redis } 的场景
// 导出一个 proxy 或者在模块加载时尝试创建
try {
  // 尝试立即创建（环境变量就绪时）
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (url && token) {
    _redis = new Redis({ url, token });
  }
} catch {
  // 静默失败，使用 getRedis() 延迟初始化
}

// BUG-013: 始终通过 Proxy 包装，确保 JSON.parse/stringify 异常被捕获并记录，返回 null 而非静默吞掉
//
// ⚠️ 这个 Proxy 只适合「后台/旁路」调用（setCache、observe、provider 缓存写……）：
//    它把所有失败压成 null，调用方分不清「键不存在」和「Redis 挂了」，而且没有时长上限
//    （@upstash/redis 默认重试 5 次 ≈ 4.3s 退避）。
//    **用户路径上的读/限流请改用下面的 redisUserPath()**，它有期限 + 明确的失败原因。
export const redis: Record<string, (...args: unknown[]) => Promise<unknown>> = new Proxy({} as any, {
  get(_target: any, prop: string) {
    return (...args: any[]) => {
      const r = getRedis();
      if (!r) {
        console.warn(`[Redis] 操作 ${prop} 跳过：Redis 未初始化`);
        return Promise.resolve(null);
      }
      return Promise.resolve()
        .then(() => (r as any)[prop](...args))
        .catch((err: unknown) => {
          console.error(`[Redis] 操作 ${prop} 失败:`, err);
          return null;
        });
    };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 用户路径上的「有界等待」（闸门在下一节）
// ══════════════════════════════════════════════════════════════════════
//
// 问题：Redis 在 iad1、函数在 hkg1，单次往返 268ms；而 @upstash/redis 默认
//   retry 5 次、退避 Math.exp(i)*50ms = 50 + 136 + 370 + 1004 + 2730 ≈ 4.29s
//   （加上每次尝试自身的网络耗时还不止）。Upstash 一抖，用户就得干等 4.3s+ 才等到
//   一个「失败」，而请求开始处的 checkRateLimit 又是 fail-closed —— 于是
//   「Upstash 抖动 = 全站几秒尾延迟后 503」，连零 AI 成本的本地排盘都被拖下水。
//
// 做法：**不动全局 retry**（瞬时抖动下重试是有价值的，尤其是后台那批写；一刀切调低
//   只会把「本来能重试成功」的请求变成失败），只给用户路径上那几个必经调用封一个总时长
//   上限。到点就按调用方各自的降级策略走，底下那条重试链继续在后台跑完 —— 对写命令
//   （限流的 INCR、熔断记账）这一点很重要：我们不再等它，但它多半还是会落库，计数不丢。
//
// 期限取 1500ms 的论证（勿随手改小）：
//   - 健康态：单条命令/一次 pipeline ≈ 268ms。
//   - 冷连接首命令实测 ≈ 720ms（含 DNS + TCP + TLS；undici 的 keepAliveTimeout 只有 4s，
//     Serverless 实例每次被唤醒、或一次 AI 调用之后，第一条命令基本都是冷的）。
//   - 允许「冷连接首发失败 → 退避 50ms → 再来一次完整冷连接」的完整一轮：
//     720 + 50 + 720 ≈ 1.49s。1.5s 之内该救回来的瞬时抖动都救回来了。
//   - 再往上等没有收益：第 2 次重试要等到退避 136ms 之后（累计 ~2.3s），第 3 次到 ~4.3s，
//     都远超「用户还愿意等」的窗口；把 2s 当上限只是多罚用户 0.5s，救不回更多请求。
//   可用 REDIS_USER_PATH_TIMEOUT_MS 覆盖（夹在 200~5000ms，防手滑配成 0 或天文数字）。
const DEFAULT_USER_PATH_TIMEOUT_MS = 1500;
export const REDIS_USER_PATH_TIMEOUT_MS = (() => {
  const raw = Number(process.env.REDIS_USER_PATH_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_USER_PATH_TIMEOUT_MS;
  return Math.min(5000, Math.max(200, Math.round(raw)));
})();

// ══════════════════════════════════════════════════════════════════════
// 进程内「不可达」闸门 —— 按调用方关键级分级（第五轮修复 MAJOR-1）
// ══════════════════════════════════════════════════════════════════════
//
// 闸门本身的用途没变：连续 N 次超时后，冷却窗内不再每个请求都去撞一次 1.5s；
// 冷却结束只放一个探针去试，其余照旧降级（避免恢复瞬间一拥而上）。
//
// 上一轮的实现是**进程级单一闸门**：任何调用方的超时都能把它打开，打开后任何调用方都被挡住。
// 由此产生一条严重的放大路径：
//   getCache（best-effort：读不到就当未命中，代价上限是多打一次模型）连续 3 次超时
//   → 闸门打开 → 冷却窗内 checkRateLimit（默认 fail-closed）拿到 short_circuit → 直接 503。
// 即「一次无关紧要的缓存读失败」被放大成「该实例 5 秒内全站拒服务」，方向完全反了。
//
// 分级模型（两级，各自独立计数、独立冷却、独立探针位）：
//   best-effort —— 失败没有用户可见后果：cache.get、circuit.* 的读与记账。
//                  闸门对它**硬短路**（立即返回 short_circuit，成本 0），这正是闸门该干的事。
//   critical    —— 失败会拒绝真实用户：checkRateLimit（默认 fail-closed）。
//                  闸门对它**不硬短路**，改为压期限做一次「验证性尝试」，理由见 VERIFY_TIMEOUT_MS。
// 计数与传播规则（关键级从高往低单向传播）：
//   - best-effort 超时**只**喂 best-effort 闸门。它证明不了「限流那条命令此刻也不可达」，
//     更没资格替限流器去拒绝真实用户。
//   - critical 超时同时喂两个闸门：它是更强的证据，而让 best-effort 跟着短路只是少读一次缓存，
//     零风险、还省一次跨区往返。
//   - 任何一次「服务端回过话」（成功，或协议级错误）清空**所有**闸门 —— 可达性是全局事实，
//     早一点解除降级永远比晚一点好。
export type RedisTier = 'best-effort' | 'critical';

const DOWN_TRIP_TIMEOUTS = 3; // 连续 3 次超时才判定不可达：单次慢不算数，避免误伤
/**
 * 短路窗口：够躲过一波抖动，又不会在 Redis 恢复后拖太久。
 *
 * ⚠️ 对外耦合：rate-limit.ts 用它推导「降级 503 的 Retry-After 下限」。
 *    理由是客户端在冷却窗内重试拿不到任何新信息 —— best-effort 直接硬短路，
 *    critical 也只是走 750ms 的 verify 槽，多半照样降级。所以「建议重试时间」
 *    不该短于这个窗。改这里的值时顺带看一眼 rate-limit.ts 的 DEGRADED_RETRY_AFTER_S。
 */
export const REDIS_DOWN_COOLDOWN_MS = 5000;
// 「连续」必须带时间约束：相隔几十分钟的 3 次零星超时不是「当下不可达」的证据。
// 超过 2 倍冷却窗没有新的超时 → 计数重新起算（否则低频抖动会慢慢攒够 3 次误开闸门）。
const TIMEOUT_STREAK_TTL_MS = REDIS_DOWN_COOLDOWN_MS * 2;
// 探针用更宽的期限（常规的 2 倍）。原因是一个必须堵死的坏状态：
// 若探针和常规调用共用 1.5s 期限，那么「Redis 活着但稳定慢于 1.5s」时探针会永远超时，
// 闸门每 5s 续一次、**永久锁死在降级态**，明明够得着的 Redis 被我们自己判了死刑。
// 放宽到 3s 后，只要 Redis 还回话，闸门必定能被探针解开（代价是那一个探针请求多等一会儿，
// 每 5s 冷却窗最多一个，可接受）。
const PROBE_TIMEOUT_MS = REDIS_USER_PATH_TIMEOUT_MS * 2;
// critical 在冷却窗内的「验证性尝试」期限（默认 750ms）。为什么不像 best-effort 那样硬短路：
//   短路态只是「本实例最近连撞 3 次超时」这个**历史**结论，不等于此刻 Redis 一定不可用
//   —— 抖动可能只持续几百毫秒，而冷却窗有 5s。赌错的代价两级完全不同：
//   best-effort 赌错只是少读一次缓存；fail-closed 的限流器赌错，是把真实（多半还付了钱的）
//   用户挡在门外整整 5 秒，而且是在「Redis 其实已经好了」的情况下。成本闸门可以保守，
//   但不该凭一条过期的进程内状态直接拒人。
//   折中做法：冷却窗内仍然发一次请求，只是把期限从 1500ms 压到 750ms：
//   - Redis 真挂着 → 750ms 后超时，照样按降级策略走（fail-closed 仍是 503），
//     只比硬短路多花 750ms，而这些请求本来就要 503；
//   - Redis 已恢复（热连接往返 268ms）→ 拿到真实计数，正常放行，并顺手清掉闸门。
//   ⇒ 相对硬短路这是**严格的正确性改进**，代价（冷却窗内每请求 ≤750ms）有界，
//     且只发生在「已经连撞 3 次超时」的少数窗口里。
//   注：冷连接首命令实测 ~720ms，压进 750ms 只是勉强够；不够就退回超时降级 ——
//   与硬短路的结果完全一致，不会更差。
// ⚠️ 验证性尝试的超时**不喂闸门**，两个理由缺一不可：
//    1) 它用的期限只有一半，证据强度与常规调用不同，不该等价计数；
//    2) 若它也能续期冷却窗，持续流量下 downUntil 会被无限往后推，
//       「冷却结束放一个宽期限探针」的解锁路径将永远轮不到 —— 闸门会被自己锁死。
const VERIFY_TIMEOUT_MS = Math.max(300, Math.round(REDIS_USER_PATH_TIMEOUT_MS / 2));

type GateState = {
  consecutiveTimeouts: number;
  lastTimeoutAt: number;
  downUntil: number; // 0 = 认为健康
  probeInFlight: boolean;
};

function freshGate(): GateState {
  return { consecutiveTimeouts: 0, lastTimeoutAt: 0, downUntil: 0, probeInFlight: false };
}

const gates: Record<RedisTier, GateState> = {
  'best-effort': freshGate(),
  critical: freshGate(),
};

/**
 * 一次用户路径 Redis 调用的结果。
 * 刻意不抛错、也不把失败压成 null —— 调用方必须能区分
 * 「Redis 说没有这个键」和「Redis 没回话」，前者是业务事实，后者要走降级策略。
 */
export type RedisAttempt<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unconfigured' | 'short_circuit' | 'error'; error?: unknown }
  // 超时分支额外带上 pending：期限只是 Promise.race，**底层请求并没有被取消**，
  // 它多半还会在后台落库。带副作用的调用方（限流 INCR、熔断抢锁）必须能知道
  // 「那条命令最后到底落没落」，才谈得上补偿。见 RedisSettlement。
  | { ok: false; reason: 'timeout'; pending: Promise<RedisSettlement<T>> };

/**
 * 超时后底层请求的最终归宿。**永不 reject**（rejection 已在内部转成 landed:false），
 * 调用方可以放心 .then() 而不必担心制造 unhandledRejection。
 */
export type RedisSettlement<T> = { landed: true; value: T } | { landed: false; error: unknown };

const DEADLINE = Symbol('redis-deadline');

type Slot = 'pass' | 'probe' | 'verify' | 'blocked';

function takeSlot(tier: RedisTier): Slot {
  const g = gates[tier];
  if (g.downUntil === 0) return 'pass';
  const blocked = Date.now() < g.downUntil || g.probeInFlight;
  if (blocked) {
    // critical 不硬短路：压期限再试一次（理由见 VERIFY_TIMEOUT_MS）
    return tier === 'critical' ? 'verify' : 'blocked';
  }
  g.probeInFlight = true;
  return 'probe';
}

/**
 * 记录「链路是通的」。注意：拿到协议级错误（UpstashError / JSON 解析失败）同样算通 ——
 * 那说明服务端**回话了**，只是内容不合我们的意；把它算成「不可达」会让一条脏缓存值
 * 连累整站限流 fail-closed 变 503。闸门只负责判断「够不够得着」，不判断「对不对」。
 *
 * 可达性是全局事实，所以一次成功清空**所有**关键级的闸门（含 best-effort 触发的那个）。
 */
function markReachable(): void {
  for (const g of Object.values(gates)) {
    g.consecutiveTimeouts = 0;
    g.lastTimeoutAt = 0;
    g.downUntil = 0;
  }
}

function tripGate(tier: RedisTier, label: string, timeoutMs: number): void {
  const g = gates[tier];
  const now = Date.now();
  if (g.lastTimeoutAt > 0 && now - g.lastTimeoutAt > TIMEOUT_STREAK_TTL_MS) {
    g.consecutiveTimeouts = 0; // 距上次超时太久，不算「连续」
  }
  g.lastTimeoutAt = now;
  g.consecutiveTimeouts += 1;
  if (g.consecutiveTimeouts >= DOWN_TRIP_TIMEOUTS) {
    const wasDown = g.downUntil > now;
    g.downUntil = now + REDIS_DOWN_COOLDOWN_MS;
    if (!wasDown) {
      console.error(
        `[Redis][ALERT] [${tier}] 连续 ${g.consecutiveTimeouts} 次超过 ${timeoutMs}ms 期限（最近一次: ${label}），` +
          `本实例该级进入降级 ${REDIS_DOWN_COOLDOWN_MS}ms。`,
      );
    }
  }
}

function markTimeout(tier: RedisTier, label: string, timeoutMs: number): void {
  // 关键级从高往低单向传播：critical 超时是更强证据，best-effort 跟着降级零风险；
  // 反向绝不允许（best-effort 的失败不得让限流器去拒人）。
  const targets: RedisTier[] = tier === 'critical' ? ['critical', 'best-effort'] : ['best-effort'];
  for (const t of targets) tripGate(t, label, timeoutMs);
}

/**
 * 用户路径专用的 Redis 调用包装：有期限 + 进程内分级闸门 + 明确的失败原因。
 *
 * 只包「请求开始处那几个必经调用」（限流、缓存读、熔断读）以及熔断记账这类会阻塞响应的写。
 * 后台/旁路写（setCache、observe）不要包：它们不占用户时间，让它们把 4.3s 重试预算用满
 * 反而更可能把数据写进去。
 *
 * @param opts.tier 默认 'best-effort'。**只有「失败会拒绝真实用户」的调用才配 'critical'**
 *   （目前仅 checkRateLimit）。配错的方向性后果：把 best-effort 误标 critical，
 *   会让无关紧要的缓存超时重新获得拖垮限流判定的能力 —— 正是本轮要修的那个 bug。
 *
 * 超时不会取消底层请求（REST 重试链继续跑完）；Promise.race 已订阅该 Promise，
 * 迟到的 rejection 不会变成 unhandledRejection。需要为「迟到落库」做补偿的调用方
 * 请用返回值里的 pending。
 */
export async function redisUserPath<T>(
  label: string,
  op: (client: Redis) => Promise<T>,
  opts?: { tier?: RedisTier },
): Promise<RedisAttempt<T>> {
  const tier = opts?.tier ?? 'best-effort';
  const client = getRedis();
  if (!client) return { ok: false, reason: 'unconfigured' };

  const slot = takeSlot(tier);
  if (slot === 'blocked') return { ok: false, reason: 'short_circuit' };

  // probe（冷却结束后的第一个请求）用更宽的期限；verify（critical 在冷却窗内）用一半期限
  const timeoutMs =
    slot === 'probe' ? PROBE_TIMEOUT_MS : slot === 'verify' ? VERIFY_TIMEOUT_MS : REDIS_USER_PATH_TIMEOUT_MS;

  // op 同步抛错（参数不合法等）也统一转成 rejection，保证本函数永不向调用方抛
  const opPromise = Promise.resolve().then(() => op(client));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(DEADLINE), timeoutMs);
  });

  try {
    const value = await Promise.race([opPromise, deadline]);
    markReachable();
    return { ok: true, value };
  } catch (err) {
    if (err === DEADLINE) {
      // verify 槽的超时不喂闸门，否则冷却窗会被自己无限续期、探针永远轮不到（见 VERIFY_TIMEOUT_MS）
      if (slot !== 'verify') markTimeout(tier, label, timeoutMs);
      return {
        ok: false,
        reason: 'timeout',
        pending: opPromise.then<RedisSettlement<T>, RedisSettlement<T>>(
          (value) => ({ landed: true, value }),
          (error: unknown) => ({ landed: false, error }),
        ),
      };
    }
    // 能在期限内抛出来的必然是「服务端回过话」的错误：网络失败要把 4.29s 退避走完才抛，
    // 早被上面的期限截胡了。所以这里一律按「可达但这条命令失败」处理，不计入不可达闸门。
    markReachable();
    console.warn(`[Redis] ${label} 失败:`, err);
    return { ok: false, reason: 'error', error: err };
  } finally {
    clearTimeout(timer);
    if (slot === 'probe') gates[tier].probeInFlight = false;
  }
}

/**
 * 该级闸门当前是否处于「已判定不可达」的冷却窗内。
 * 给调用方一个廉价的只读判据，用来跳过那些「明知做不成还要空等」的后台补偿动作
 * （如限流退款：Redis 全挂时 pending 必然 landed:false，等满 REFUND_WAIT_MS 纯属浪费实例时长）。
 * 注意：这只是本实例的历史结论，不代表此刻 Redis 一定不可用——只可用于放弃可选动作，
 * 绝不可用于拒绝用户请求（那正是 critical 级不做硬短路、改走 verify 槽的原因）。
 */
export function isTierDown(tier: RedisTier): boolean {
  return Date.now() < gates[tier].downUntil;
}

/** 仅供测试/诊断：重置进程内不可达闸门。生产代码不要调用。 */
export function __resetRedisHealthGate(): void {
  gates['best-effort'] = freshGate();
  gates.critical = freshGate();
}

/** 仅供测试/诊断：读一眼各级闸门状态。生产代码不要依赖。 */
export function __redisGateSnapshot(): Record<RedisTier, GateState> {
  return { 'best-effort': { ...gates['best-effort'] }, critical: { ...gates.critical } };
}

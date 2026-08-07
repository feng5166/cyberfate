import { getRedis, redisUserPath, type RedisSettlement } from '@/lib/cache/redis';

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN — service unavailable`);
    this.name = 'CircuitOpenError';
  }
}

const FAILURE_THRESHOLD = 5;
const RECOVERY_WINDOW_MS = 30_000;
const OPEN_TTL_S = 300; // OPEN 标记兜底 TTL：即便一直没流量来探活，5 分钟后也自动恢复
const FAILURE_TTL_S = 300; // 失败计数窗口：从首次失败起 5 分钟（对齐旧实现整条记录的 TTL）
// 探针锁 TTL 需覆盖单次 AI 调用时长（最长 tarot ~115s 之外的常规 55s 档），
// 否则探针还在跑就有第二个探针放行；探针实例崩溃时最多多短路 60s，方向安全
const PROBE_TTL_S = 60;

// 状态拆成三个独立键，替代旧版整块 JSON 读-改-写（并发失败会互相覆盖计数）：
// :open     存 openedAt 毫秒时间戳，存在即 OPEN
// :failures 纯计数器，INCR 原子累计
// :probe    half-open 探针锁（SET NX 抢占）
function openKey(name: string) {
  return `circuit:${name}:open`;
}
function failKey(name: string) {
  return `circuit:${name}:failures`;
}
function probeKey(name: string) {
  return `circuit:${name}:probe`;
}

// 探针锁写的是一个**唯一令牌**而不是常量 '1'，这样才谈得上「只释放自己的锁」。
// 见 releaseOwnProbeLock：抢锁超时后必须能安全撤销，而撤销的前提是能认出锁是不是自己的。
function probeToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Redlock 式释放：值等于自己的令牌才删。
// 直接 DEL 是**错的** —— 抢锁超时时锁很可能属于另一个正在跑探针的实例（我们的 SET NX 只是没抢到），
// 盲删会把它的锁抹掉，第三个实例随即拿到锁 → 两个探针同时打刚复活的上游，正是这把锁要防的事。
const PROBE_RELEASE_SCRIPT = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0`;

/**
 * 抢探针锁超时后的补偿（第五轮修复 MINOR-3）。
 *
 * redisUserPath 的期限不取消底层请求：SET NX 很可能在我们放弃之后才落库。
 * 那样这个实例既没跑探针、锁又被自己占着，要白等 PROBE_TTL_S(60s) 才有人能再试 ——
 * 熔断器凭空多短路一分钟。
 *
 * 做法：等那条 SET 真正 settle（pending 永不 reject），若结果是 'OK'（= 锁确实被我们抢到了），
 * 再按令牌删掉它。等 settle 而不是立刻盲发 DEL，顺带消除了「DEL 先到、迟到的 SET 后落库」
 * 那条乱序 —— 那种乱序下锁会照样留到 TTL 到期，等于白补偿。
 *
 * 不阻塞调用方：本函数同步返回，调用方照常抛 CircuitOpenError 走降级。
 * 这里刻意不包 next/server 的 after()：一是不想把请求生命周期 API 耦合进 AI 内核，
 * 二是抛出 CircuitOpenError 之后调用方还要跑降级链路（换模型/兜底文案），
 * 那几秒里实例本来就活着，SET 的重试链足够 settle。真被冻结也只是退回 60s TTL 兜底
 * （= 修复前的行为，不会更差）。
 */
function releaseOwnProbeLock(
  name: string,
  token: string,
  pending: Promise<RedisSettlement<unknown>>,
): void {
  void pending
    .then(async (settled) => {
      // landed:false → SET 最终失败，锁没被我们写进去；value !== 'OK' → NX 没抢到，锁是别人的
      if (!settled.landed || settled.value !== 'OK') return;
      const r = getRedis();
      if (!r) return;
      await r.eval(PROBE_RELEASE_SCRIPT, [probeKey(name)], [token]);
      console.warn(`[CircuitBreaker] ${name} 抢锁超时但锁已落库，已释放，避免白锁 ${PROBE_TTL_S}s`);
    })
    .catch(() => {
      /* 释放失败就退回 TTL 兜底，不能反过来影响业务 */
    });
}

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fn(); // 无 Redis 时熔断降级为直通（与旧实现一致）

  // 所有 Redis 调用走 redisUserPath（期限 1.5s + 进程内分级闸门）：
  // 熔断读在请求最开头、记账写在响应返回前，全都占用户时间。Redis 在 iad1（往返 268ms），
  // 抖动时默认重试链要 4.3s —— 熔断器是为了保护用户，不能自己变成延迟来源。
  //
  // 本模块全部用默认的 **best-effort** 关键级（不传 tier）：熔断器读不到状态时一律按 CLOSED 直通，
  // 记账写丢了也有 TTL 兜底，没有一条路径会因此拒绝用户。所以它的超时**不该**、
  // 从第五轮起也**不会**再把限流器那道 fail-closed 闸门一起带下水（见 redis.ts 分级模型）。
  //
  // 一次 MGET 拿开闸标记 + 失败计数；读不到（超时/短路/出错）一律按 CLOSED 直通 ——
  // 熔断器自身故障不能拒绝业务请求（与旧实现一致，只是现在最多等 1.5s 而不是 4.3s）
  const state = await redisUserPath(`circuit.read:${name}`, (r) =>
    r.mget<[unknown, unknown]>(openKey(name), failKey(name)),
  );
  const openedAtRaw: unknown = state.ok ? state.value?.[0] ?? null : null;
  const failuresRaw: unknown = state.ok ? state.value?.[1] ?? null : null;

  let isProbe = false;
  if (openedAtRaw != null) {
    const openedAt = Number(openedAtRaw) || 0;
    if (Date.now() - openedAt < RECOVERY_WINDOW_MS) {
      throw new CircuitOpenError(name);
    }
    // half-open：SET NX 抢唯一探针权——只放一个请求试探上游，其余照旧短路走降级，
    // 避免恢复窗口一到就放行一批请求把刚复活的上游再次打挂。
    // 抢锁超时/失败按「没抢到」处理（与旧实现的 .catch(() => null) 同义）：
    // 宁可多短路一轮走降级，也不要放两个探针把刚复活的上游打回去。
    const token = probeToken();
    const probe = await redisUserPath(`circuit.probe:${name}`, (r) =>
      r.set(probeKey(name), token, { nx: true, ex: PROBE_TTL_S }),
    );
    if (!probe.ok || !probe.value) {
      // 超时 ≠ 没写进去：后台重试链多半仍会把锁落库。不撤销的话这一分钟里
      // 没有任何实例能再探活（MINOR-3）
      if (!probe.ok && probe.reason === 'timeout') releaseOwnProbeLock(name, token, probe.pending);
      throw new CircuitOpenError(name);
    }
    isProbe = true;
  }

  try {
    const result = await fn();
    // 成功路径条件写：仅在确有状态要清（开过闸/有失败计数）时才写 Redis，
    // 消除旧实现「每次成功调用都写一次 CLOSED」的固定写往返
    if (isProbe || openedAtRaw != null || (Number(failuresRaw) || 0) > 0) {
      // 这次 DEL 卡在 AI 调用之后、响应返回之前，是实打实的用户等待；超时就不等了，
      // 底层重试链还在后台跑，DEL 多半照样会落库（幂等，重复执行也无害）。
      // 万一真没落库：openKey 有 OPEN_TTL_S、failKey 有 FAILURE_TTL_S 兜底，最多 5 分钟自愈
      await redisUserPath(`circuit.clear:${name}`, (r) =>
        r.del(openKey(name), failKey(name), probeKey(name)),
      );
    }
    return result;
  } catch (err) {
    try {
      // INCR 原子累计，消除旧版读-改-写竞态（并发失败互相覆盖导致计数偏低、熔断迟迟不开）。
      // pipeline 单次往返完成 incr+expire：原「仅 failures===1 时补 TTL」的写法一旦 INCR 成功而
      // EXPIRE 失败，就会留下永不过期的计数键，计数只增不减，最终熔断永远开着（与 rate-limit 同一修法）。
      // expire 带 NX（仅在键无 TTL 时设置）：既保持「窗口从首次失败起算」的语义，也自愈历史泄漏的无 TTL 键
      if (isProbe) {
        // half-open 探针失败：结论与失败计数无关（必定重新开闸 + 释放探针锁），
        // 不需要等 INCR 的返回值 → 四条命令并进同一次 pipeline，跨区往返 3 次压到 1 次。
        // 命令按入队顺序在服务端执行，与原来的 incr → expire → set(open) → del(probe) 完全一致
        await redisUserPath(`circuit.reopen:${name}`, (r) =>
          r
            .pipeline()
            .incr(failKey(name))
            .expire(failKey(name), FAILURE_TTL_S, 'nx')
            .set(openKey(name), String(Date.now()), { ex: OPEN_TTL_S })
            .del(probeKey(name))
            .exec(),
        );
      } else {
        // 非探针失败：开不开闸取决于 INCR 的返回值，而 pipeline 内读不到前序结果，
        // 只能拆成两次；好在「刚好踩到阈值」是罕见事件，绝大多数失败只花这一次往返
        const bump = await redisUserPath(`circuit.fail:${name}`, (r) =>
          r
            .pipeline()
            .incr(failKey(name))
            .expire(failKey(name), FAILURE_TTL_S, 'nx')
            .exec<[number, 0 | 1]>(),
        );
        // 记账超时/失败 → 本轮不做开闸判断。INCR 仍在后台重试链里往下跑，多半会落库，
        // 下一次失败读到的计数照样是对的，只是开闸可能晚一次。
        // 反过来若在这里「拿不到计数就开闸」，Redis 抖动会被误判成上游挂了，
        // 把健康的 AI 链路整条掐掉 —— 方向上必须偏保守
        if (bump.ok) {
          const failures = Number(bump.value?.[0]) || 0;
          if (failures >= FAILURE_THRESHOLD) {
            // 失败数到阈值：开闸，openedAt 取当前时刻
            await redisUserPath(`circuit.open:${name}`, (r) =>
              r.set(openKey(name), String(Date.now()), { ex: OPEN_TTL_S }),
            );
          }
        }
      }
    } catch {
      /* 熔断记账失败不掩盖业务错误 */
    }
    throw err;
  }
}

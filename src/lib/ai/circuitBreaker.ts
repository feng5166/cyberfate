import { getRedis } from '@/lib/cache/redis';

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

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fn(); // 无 Redis 时熔断降级为直通（与旧实现一致）

  // 一次 MGET 拿开闸标记 + 失败计数；读失败按 CLOSED 直通——熔断器自身故障不能拒绝业务请求
  let openedAtRaw: unknown = null;
  let failuresRaw: unknown = null;
  try {
    [openedAtRaw, failuresRaw] = await redis.mget<[unknown, unknown]>(openKey(name), failKey(name));
  } catch {
    /* ignore */
  }

  let isProbe = false;
  if (openedAtRaw != null) {
    const openedAt = Number(openedAtRaw) || 0;
    if (Date.now() - openedAt < RECOVERY_WINDOW_MS) {
      throw new CircuitOpenError(name);
    }
    // half-open：SET NX 抢唯一探针权——只放一个请求试探上游，其余照旧短路走降级，
    // 避免恢复窗口一到就放行一批请求把刚复活的上游再次打挂
    const got = await redis
      .set(probeKey(name), '1', { nx: true, ex: PROBE_TTL_S })
      .catch(() => null);
    if (!got) throw new CircuitOpenError(name);
    isProbe = true;
  }

  try {
    const result = await fn();
    // 成功路径条件写：仅在确有状态要清（开过闸/有失败计数）时才写 Redis，
    // 消除旧实现「每次成功调用都写一次 CLOSED」的固定写往返
    if (isProbe || openedAtRaw != null || (Number(failuresRaw) || 0) > 0) {
      await redis.del(openKey(name), failKey(name), probeKey(name)).catch(() => {});
    }
    return result;
  } catch (err) {
    try {
      // INCR 原子累计，消除旧版读-改-写竞态（并发失败互相覆盖导致计数偏低、熔断迟迟不开）。
      // pipeline 单次往返完成 incr+expire：原「仅 failures===1 时补 TTL」的写法一旦 INCR 成功而
      // EXPIRE 失败，就会留下永不过期的计数键，计数只增不减，最终熔断永远开着（与 rate-limit 同一修法）。
      // expire 带 NX（仅在键无 TTL 时设置）：既保持「窗口从首次失败起算」的语义，也自愈历史泄漏的无 TTL 键
      const [incrResult] = await redis
        .pipeline()
        .incr(failKey(name))
        .expire(failKey(name), FAILURE_TTL_S, 'nx')
        .exec<[number, 0 | 1]>();
      const failures = Number(incrResult) || 0;
      if (isProbe || failures >= FAILURE_THRESHOLD) {
        // 探针失败或失败数到阈值：重新开闸，openedAt 取当前时刻
        await redis.set(openKey(name), String(Date.now()), { ex: OPEN_TTL_S });
        if (isProbe) await redis.del(probeKey(name)); // 释放探针锁，下个恢复窗口可再探
      }
    } catch {
      /* 熔断记账失败不掩盖业务错误 */
    }
    throw err;
  }
}

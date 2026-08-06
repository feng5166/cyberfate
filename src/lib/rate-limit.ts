/**
 * Redis-based rate limiting (Upstash)
 * Fails closed when Redis is unavailable (BUG-R2-002)
 */

import { getRedis } from '@/lib/cache/redis';

export async function checkRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  // failOpen：零成本端点可选放行降级（Redis 挂了宁可放行也不 503）；默认 fail-closed 保护 AI 成本
  opts?: { failOpen?: boolean }
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const redis = getRedis();
  if (!redis) {
    if (opts?.failOpen) {
      console.warn('[rate-limit] Redis unavailable, failing open');
      return { allowed: true, remaining: limit };
    }
    console.error('[rate-limit] Redis unavailable, denying request');
    return { allowed: false, remaining: 0, reason: 'service_unavailable' };
  }

  const key = `rl:${prefix}:${identifier}`;
  try {
    // pipeline 单次 REST 往返完成 incr+expire。原两步写法有两个问题：
    // 1) 两次跨区往返；2) incr 成功后 expire 失败 → key 永无 TTL → 该用户/IP 永久 429。
    // expire 带 NX（仅无 TTL 时设置）：既覆盖新建 key，也自愈历史泄漏的无 TTL key。
    const [count] = await redis
      .pipeline()
      .incr(key)
      .expire(key, windowSeconds, 'nx')
      .exec<[number, 0 | 1]>();
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch (err) {
    if (opts?.failOpen) {
      console.warn('[rate-limit] Redis error, failing open:', err);
      return { allowed: true, remaining: limit };
    }
    console.error('[rate-limit] Redis error, denying request:', err);
    return { allowed: false, remaining: 0, reason: 'service_unavailable' };
  }
}

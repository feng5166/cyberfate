/**
 * Redis-based rate limiting (Upstash)
 * Gracefully degrades to allow-all when Redis is unavailable
 */

import { getRedis } from '@/lib/cache/redis';

export async function checkRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) {
    // Redis 不可用时降级放行
    return { allowed: true, remaining: limit };
  }

  const key = `rl:${prefix}:${identifier}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch (err) {
    console.error('[rate-limit] Redis error, degrading to allow:', err);
    return { allowed: true, remaining: limit };
  }
}

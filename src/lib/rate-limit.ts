/**
 * Redis-based rate limiting (Upstash)
 * Fails closed when Redis is unavailable (BUG-R2-002)
 */

import { getRedis } from '@/lib/cache/redis';

export async function checkRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const redis = getRedis();
  if (!redis) {
    console.error('[rate-limit] Redis unavailable, denying request');
    return { allowed: false, remaining: 0, reason: 'service_unavailable' };
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
    console.error('[rate-limit] Redis error, denying request:', err);
    return { allowed: false, remaining: 0, reason: 'service_unavailable' };
  }
}

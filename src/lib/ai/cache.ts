/**
 * AI 响应缓存（Redis 持久化）
 * 用于提高相同参数请求的稳定性和响应速度
 */

import { redis } from '../cache/redis';

/**
 * 生成缓存 key（基于输入参数）
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}:${JSON.stringify(params[k])}`)
    .join('|');
  return `${prefix}:${sorted}`;
}

/**
 * 获取缓存（异步）
 */
export async function getCache(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Cache Hit] ${key}`);
      return cached;
    }
    return null;
  } catch (err) {
    console.warn('[Cache Read Error]', err);
    return null;
  }
}

/**
 * 设置缓存（异步）
 * @param key 缓存键
 * @param data 缓存数据
 * @param ttl 过期时间（秒），不传则永久保存
 */
export async function setCache(key: string, data: any, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, data);
      console.log(`[Cache Set] ${key} (TTL: ${ttl}s)`);
    } else {
      await redis.set(key, data);
      console.log(`[Cache Set] ${key} (永久)`);
    }
  } catch (err) {
    console.warn('[Cache Write Error]', err);
  }
}

/**
 * 缓存统计（占位）
 */
export async function getCacheStats() {
  return {
    provider: 'Upstash Redis',
    note: '统计功能需要 Redis INFO 命令',
  };
}

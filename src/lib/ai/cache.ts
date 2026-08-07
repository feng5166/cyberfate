/**
 * AI 响应缓存（Redis 持久化）
 * 用于提高相同参数请求的稳定性和响应速度
 */

import { redis } from '../cache/redis';

function sortedStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v as object).sort().reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (v as Record<string, unknown>)[k];
        return acc;
      }, {});
    }
    return v;
  });
}

/**
 * 生成缓存 key（基于输入参数）
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}:${sortedStringify(params[k])}`)
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
      if (process.env.NODE_ENV !== 'production') console.log(`[Cache Hit] ${key}`);
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
 *
 * ⚠️ 别在这里包 next/server 的 after()（第三轮性能优化已评估并否决，勿再尝试）：
 * 1. 本函数是 6 个路由共用的写原语，包 after() 等于替所有调用方改 await 语义，
 *    其中 bazi/marriage、meihua/draw 的写点各有自己的时序约束（marriage 有多处写、
 *    meihua/draw 的写发生在流关闭前），一刀切会改到没人评估过的地方。
 * 2. 在原语层包 after() 会剥夺调用方「after() 不可用时退回内联 await」的选择权 ——
 *    那条降级分支是各路由自己按业务重要性决定的（如 tarot 的退款宁可内联也不能丢）。
 *    注：嵌套 after 本身是安全的，Next 的 AfterContext.addCallback 显式支持
 *    （读 afterTaskStore 识别 nested after 并保留 rootTaskSpawnPhase），
 *    所以「tarot 会变成 after 套 after」不构成否决理由，别再拿它当依据。
 * ⇒ 需要延后的路由请在各自调用处包 after()（写法见 liuyao / meihua/decide），
 *    并保留「after() 抛错时退回内联 await」的降级分支。
 */
export async function setCache(key: string, data: any, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, data);
      if (process.env.NODE_ENV !== 'production') console.log(`[Cache Set] ${key} (TTL: ${ttl}s)`);
    } else {
      await redis.set(key, data);
      if (process.env.NODE_ENV !== 'production') console.log(`[Cache Set] ${key} (永久)`);
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

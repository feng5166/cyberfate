/**
 * AI 响应缓存（内存 LRU）
 * 用于提高相同参数请求的稳定性和响应速度
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number; // 毫秒

  constructor(maxSize = 1000, ttlMinutes = 60) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // LRU：移到最后
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: any): void {
    // 淘汰最老的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 全局单例
const aiCache = new LRUCache(1000, 60); // 最多 1000 条，TTL 60 分钟

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
 * 获取缓存
 */
export function getCache(key: string): any | null {
  return aiCache.get(key);
}

/**
 * 设置缓存
 */
export function setCache(key: string, data: any): void {
  aiCache.set(key, data);
}

/**
 * 清空缓存（调试用）
 */
export function clearCache(): void {
  aiCache.clear();
}

/**
 * 缓存统计
 */
export function getCacheStats() {
  return {
    size: aiCache.size(),
    maxSize: 1000,
    ttl: '60 minutes',
  };
}

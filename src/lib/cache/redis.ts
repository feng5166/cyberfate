/**
 * Upstash Redis 客户端（Vercel 集成）
 * 用于八字分析和每日运势的持久化缓存
 * 环境变量缺失时优雅降级，不阻塞主流程
 */

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

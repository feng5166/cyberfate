/**
 * Upstash Redis 客户端（Vercel 集成）
 * 用于八字分析和每日运势的持久化缓存
 */

import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * AI 响应缓存（Redis 持久化）
 * 用于提高相同参数请求的稳定性和响应速度
 */

import { redis, redisUserPath } from '../cache/redis';

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

// value 用 unknown 而非 any：新接口顺手把类型收紧一格，逼调用方自己收窄；
// getCache 那条老契约仍然是 any，两边互不影响
/** 一次缓存读的判别式结果：把「真未命中」和「读不到」分开，见 readCache */
export type CacheRead =
  | { hit: true; value: unknown }
  /** 'miss' = Redis 明确说没有这个键；'unavailable' = 根本没问到（超时/短路/未配置/出错） */
  | { hit: false; reason: 'miss' | 'unavailable' };

// 合成未命中（unavailable）的观测：这是**真金白银**——每一次都意味着一次本可省下的模型调用。
// 逐条打日志在冷却窗内会刷屏（Vercel 日志按量计费），所以 10s 汇总一行。
const SYNTHETIC_MISS_LOG_INTERVAL_MS = 10_000;
let syntheticMisses = 0;
let lastSyntheticMissLogAt = 0;

function noteSyntheticMiss(reason: string): void {
  syntheticMisses += 1;
  const now = Date.now();
  if (now - lastSyntheticMissLogAt < SYNTHETIC_MISS_LOG_INTERVAL_MS) return;
  lastSyntheticMissLogAt = now;
  const n = syntheticMisses;
  syntheticMisses = 0;
  // 固定串便于配告警：合成未命中量 ≈ 这段时间被白白重复付费的模型调用量
  console.warn(`[Cache][ALERT] Redis 读不到(${reason})，最近 ${n} 次按未命中处理（每次 = 一次多花的模型调用）`);
}

/**
 * 获取缓存（判别式版本）—— 调用方能区分「真未命中」和「读不到」。
 *
 * 为什么要有它（第五轮 MINOR-4 的结论）：
 * - getCache 把 timeout / short_circuit / error 一律压成 null，在 5s 冷却窗内**每次读都必然假未命中**，
 *   每一次都白打一次模型。调用方连「要不要为这次重复付费」都无从判断。
 * - 但 getCache 的 `Promise<any|null>` 契约不能动：6 个路由都按「null 就是没缓存」写的，
 *   而路由本轮不在改动范围内。
 * ⇒ 折中：**加新导出、不动旧签名**。新代码用 readCache 拿到判别式结果，
 *   老调用方零改动继续用 getCache（内部委托给 readCache，行为逐字节不变）。
 *
 * 拿到 'unavailable' 之后该怎么办由调用方定，本层不替它决定 —— 常见的两种：
 *   a) 照旧当未命中打模型（默认，用户体验优先，代价是重复付费一次）；
 *   b) 若该路由有便宜的降级产物（本地排盘、上一版缓存），可以先给降级结果并提示重试。
 *
 * 「假未命中会不会被刷爆」在第四轮已经论证过，结论不变：
 * 1) 调用方在读缓存之前要么先过 fail-closed 的 checkRateLimit（liuyao / tarot/draw / meihua/decide），
 *    要么先过 Postgres 配额（bazi/marriage 的 checkMarriageQuota、meihua/draw 的 checkMeihuaDrawQuota
 *    —— 走 Prisma，与 Redis 死活无关，照样扣得住）。所以「假未命中」最多让**已经被授权的那次请求**
 *    多打一次模型，不会变成无限刷。
 * 2) 本模块走默认的 best-effort 关键级（见 redis.ts 分级模型）：从第五轮起，
 *    缓存读的超时**再也不会**打开限流器那道闸门，「一次缓存读失败拖垮全站」的放大路径已消除。
 */
export async function readCache(key: string): Promise<CacheRead> {
  // 不给 get 传泛型：TData 落到 unknown，正好对得上 `any` 的既有契约，
  // 也避免再引入一个 no-explicit-any 违规
  const attempt = await redisUserPath('cache.get', (r) => r.get(key));
  if (!attempt.ok) {
    if (attempt.reason === 'error') console.warn('[Cache Read Error]', attempt.error);
    noteSyntheticMiss(attempt.reason);
    return { hit: false, reason: 'unavailable' };
  }
  const cached = attempt.value;
  if (cached) {
    if (process.env.NODE_ENV !== 'production') console.log(`[Cache Hit] ${key}`);
    return { hit: true, value: cached };
  }
  return { hit: false, reason: 'miss' };
}

/**
 * 获取缓存（异步）—— 既有契约：命中返回值，其余一律 null。
 *
 * ⚠️ null 是二义的（真没缓存 / Redis 读不到），新代码请改用 readCache。
 * 这里保持签名不变是刻意的：6 个在用路由都按「null 就是没缓存」写的，
 * 改成抛错等于让 Redis 抖动直接升级成全站 500，代价远大于多花一次模型钱。
 */
export async function getCache(key: string): Promise<any | null> {
  const read = await readCache(key);
  return read.hit ? read.value : null;
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

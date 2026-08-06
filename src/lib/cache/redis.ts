/**
 * Upstash Redis 客户端（Vercel 集成）
 * 用于八字分析和每日运势的持久化缓存
 * 环境变量缺失时优雅降级，不阻塞主流程
 */

// ── 连接复用调查结论（勿再重复踩坑）────────────────────────────────────────
// 背景：生产实测 hkg1 → Upstash（AWS ap-northeast-1）单次 PING 约 268ms，而港东 RTT 仅约 50ms，
// 差额一度被怀疑是「每条 REST 命令都重新 TCP+TLS 握手」。实测结论：不是。
//
// 1) Node 的全局 fetch（内建 undici）默认就用带连接池的 Agent，同进程内连续请求复用同一条 TLS 连接。
//    本地实测（node v26，diagnostics_channel 计数）：5 次串行 fetch 同源 → undici:client:connected 只触发 1 次，
//    耗时 720ms / 201 / 203 / 208 / 250 —— 首次含握手，其后只剩 RTT。
//    因此 268ms 的采样是「每次都是冷连接的首命令」，不能证明命令级握手。
// 2) @upstash/redis 1.37 的 `agent` 选项在这里是死配置：它被塞进 fetch init 的 `agent` 字段，
//    而 WHATWG fetch/undici 只认 `dispatcher`，`agent` 被直接忽略（实测加不加，连接数都是 1）。
//    别为了「提速」去传 https.Agent，那只是自我安慰。
// 3) 想真正调连接池只能换全局 dispatcher（setGlobalDispatcher）。两条硬拦路：
//    a. undici 不是本项目依赖，Node 也不对外暴露内建副本，代码里根本 require 不到；
//    b. 全局 dispatcher 是全站副作用，AI 上游是流式长连接（bazi/stream、tarot SSE 透传），
//       keepAlive/headers/body 超时配错会把健康长流掐断 —— BLOCKER 级事故，收益远不抵风险。
// ⇒ 结论：客户端配置层无可优化。降低 Upstash 成本的唯一手段是「减少往返次数」（pipeline/合并），
//    见 rate-limit.ts、ai/circuitBreaker.ts、ai/observe.ts 的批量化写法。
//
// 附带须知：undici 默认 keepAliveTimeout 仅 4s。一次 AI 调用要等上游 20~60s，
// 这期间 Redis 连接必然被回收，所以「AI 之后的那批 Redis 写」注定要重新握手一次。
// 这更说明该压的是往返条数：同一批里第一条付握手，剩下的才只付 RTT。
// ──────────────────────────────────────────────────────────────────────

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

// LLM Provider 运行时切换
//
// 两个 provider 的模型名一致（deepseek-v4-pro / deepseek-v4-flash 官方与 ModelVerse 都认），
// 所以「切换 provider」= 换 baseUrl + apiKey，模型名不变（见 models.ts）。
//
// 激活哪个 provider 由后台开关控制（存 Redis，key = llm:active-provider）；
// 未设置时回落到 env LLM_DEFAULT_PROVIDER，再回落到 deepseek-official。
// 调用侧用 resolveProviders() 拿到 [主, 兜底] 有序列表（已过滤掉没有可用 key 的），
// 主失败时切兜底 provider。

import { redis } from '../cache/redis';
import { getEnvVar } from '../utils/api-wrapper';
import { AI_BASE_URL } from './models';

export type ProviderId = 'deepseek-official' | 'modelverse';

export interface ResolvedProvider {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKey: string;
}

export const PROVIDER_IDS: ProviderId[] = ['deepseek-official', 'modelverse'];

const REDIS_KEY = 'llm:active-provider';

function isProviderId(v: unknown): v is ProviderId {
  return v === 'deepseek-official' || v === 'modelverse';
}

/** 各 provider 的静态配置（baseUrl + key 从 env 读取，key 缺失记为 null） */
function providerConfigs(): Record<ProviderId, { label: string; baseUrl: string; apiKey: string | null }> {
  return {
    'deepseek-official': {
      label: 'DeepSeek 官方',
      baseUrl: (process.env.DEEPSEEK_OFFICIAL_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
      apiKey: getEnvVar('DEEPSEEK_OFFICIAL_API_KEY'),
    },
    'modelverse': {
      label: 'ModelVerse 网关',
      baseUrl: AI_BASE_URL.replace(/\/$/, ''),
      apiKey: getEnvVar('DEEPSEEK_API_KEY'),
    },
  };
}

/** 是否至少有一个 provider 配置了可用 key（纯 env 同步检查，用于调用前的廉价短路） */
export function hasAnyProviderKey(): boolean {
  const cfg = providerConfigs();
  return Boolean(cfg['deepseek-official'].apiKey || cfg['modelverse'].apiKey);
}

function defaultProviderId(): ProviderId {
  const env = process.env.LLM_DEFAULT_PROVIDER;
  return isProviderId(env) ? env : 'deepseek-official';
}

// 进程内缓存后台开关（60s TTL）：resolveProviders/getPrimaryProvider 处于每次 AI 调用的热路径，
// 省掉一次 Redis 往返。权衡：管理后台切 provider 后，本实例经 setActiveProviderId 失效缓存后立即重读，
// 其他 Vercel 实例最多延迟 60s 生效——切换是罕见运维操作，可接受。
// 管理页读状态走 getProviderStatus（默认 fresh 直读 Redis），不受本缓存影响
const ACTIVE_PROVIDER_CACHE_TTL_MS = 60_000;
let activeProviderCache: { id: ProviderId; at: number } | null = null;

/**
 * 当前后台开关选中的 provider（Redis 未配置/未设置时回落到 env 默认；进程内缓存 60s）。
 * fresh=true 绕过缓存直读 Redis —— 管理后台读「当前生效 provider」必须走这条通道，
 * 否则切换后 60s 内看到的是陈旧值（热路径调用一律走缓存，不受影响）
 */
export async function getActiveProviderId(opts?: { fresh?: boolean }): Promise<ProviderId> {
  const now = Date.now();
  if (!opts?.fresh && activeProviderCache && now - activeProviderCache.at < ACTIVE_PROVIDER_CACHE_TTL_MS) {
    return activeProviderCache.id;
  }
  let id = defaultProviderId();
  try {
    const v = await redis.get(REDIS_KEY);
    if (isProviderId(v)) id = v;
  } catch {
    /* Redis 不可用时静默回落 */
  }
  activeProviderCache = { id, at: now };
  return id;
}

/** 后台切换 provider */
export async function setActiveProviderId(id: ProviderId): Promise<void> {
  if (!isProviderId(id)) throw new Error(`未知 provider: ${id}`);
  await redis.set(REDIS_KEY, id);
  // 主动失效本实例缓存（而非直接写入 id）：redis 代理会吞掉写失败并返回 null，
  // 若此时把缓存置成「以为写成功」的值，本实例就会与 Redis 真值不一致。
  // 置空让下次调用回 Redis 读权威值；其他实例等各自 60s 缓存过期
  activeProviderCache = null;
}

/**
 * 解析出有序的可用 provider 列表：[激活的, 另一个]。
 * 只保留配置了可用 apiKey 的 provider —— 这样即使激活的 provider 没配 key，
 * 也会自动降级到另一个，线上不会因为 key 缺失而全挂。
 */
export async function resolveProviders(): Promise<ResolvedProvider[]> {
  const cfg = providerConfigs();
  const activeId = await getActiveProviderId();
  const order: ProviderId[] = activeId === 'deepseek-official'
    ? ['deepseek-official', 'modelverse']
    : ['modelverse', 'deepseek-official'];

  return order
    .map((id) => ({ id, label: cfg[id].label, baseUrl: cfg[id].baseUrl, apiKey: cfg[id].apiKey }))
    .filter((p): p is ResolvedProvider => Boolean(p.apiKey));
}

/** 取当前应使用的主 provider（已过滤 key）；一个可用的都没有时返回 null */
export async function getPrimaryProvider(): Promise<ResolvedProvider | null> {
  const list = await resolveProviders();
  return list[0] ?? null;
}

/**
 * 后台展示用：每个 provider 的当前状态（是否激活 / 是否已配 key）。
 * 默认直读 Redis（fresh）——这是管理页读当前 provider 的唯一入口，必须显示权威值而非本实例 60s 缓存；
 * 调用量极低（仅 admin 页面），多一次 Redis 往返不影响任何热路径
 */
export async function getProviderStatus(opts?: { fresh?: boolean }): Promise<{
  active: ProviderId;
  providers: Array<{ id: ProviderId; label: string; baseUrl: string; hasKey: boolean; active: boolean }>;
}> {
  const cfg = providerConfigs();
  const active = await getActiveProviderId({ fresh: opts?.fresh ?? true });
  return {
    active,
    providers: PROVIDER_IDS.map((id) => ({
      id,
      label: cfg[id].label,
      baseUrl: cfg[id].baseUrl,
      hasKey: Boolean(cfg[id].apiKey),
      active: id === active,
    })),
  };
}

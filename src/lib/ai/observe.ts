// T9 · AI 回退可观测 + 告警
// 各模块 AI 解读函数返回 _source('deepseek'|'fallback'|'cache')。
// 'fallback' = 模型链路失败、返回模板兜底 —— 模型不稳定的信号。
// 这里按「模块 × 北京日」在 Redis 累计 total / fallback 计数,回退率超阈值时飞书告警(带冷却去重)。
// 全程 fire-and-forget,绝不抛错/阻塞主解读流程。

import { getRedis } from '@/lib/cache/redis';
import { getTodayBeijing, getSecondsUntilBeijingMidnight } from '@/lib/timezone';
import { sendFeishuText, feishuConfigured } from '@/lib/feishu';

export type AiSource = 'deepseek' | 'fallback' | 'cache';

const MIN_SAMPLE = 20; // 样本不足不评率,避免小样本抖动误报
const ALERT_RATE = 0.3; // 当日回退率 > 30% 触发告警
const ALERT_COOLDOWN_S = 3600; // 同模块同日 1 小时内不重复告警
const COUNTER_TTL_S = 172800; // 计数键留 2 天便于排查

/**
 * 记录一次 AI 解读产出的来源(fire-and-forget)。
 * cache 命中不计入分母(未打模型,不反映稳定性)。
 */
export function observeAiOutcome(mod: string, source: AiSource): void {
  if (source === 'cache') return;
  void recordAiOutcome(mod, source).catch(() => {
    /* 观测失败绝不影响主流程 */
  });
}

/**
 * 包装器:记录 obj._source 后原样返回,便于在多 return 点一行接入。
 * 用法:`return observed('bazi', { ...data, _source: 'deepseek' })`
 */
export function observed<T extends { _source: AiSource }>(mod: string, obj: T): T {
  observeAiOutcome(mod, obj._source);
  return obj;
}

/** 观测记录的可 await 内核(observeAiOutcome 的实现;导出仅供测试直接断言,生产走 fire-and-forget)。 */
export async function recordAiOutcome(mod: string, source: AiSource): Promise<void> {
  if (source === 'cache') return;
  const redis = getRedis();
  if (!redis) return;

  const date = getTodayBeijing();
  const base = `ai:obs:${mod}:${date}`;
  const totalKey = `${base}:total`;
  const fbKey = `${base}:fallback`;

  const total = await redis.incr(totalKey);
  if (total === 1) await redis.expire(totalKey, COUNTER_TTL_S);

  let fb: number;
  if (source === 'fallback') {
    fb = await redis.incr(fbKey);
    if (fb === 1) await redis.expire(fbKey, COUNTER_TTL_S);
  } else {
    const raw = await redis.get(fbKey);
    fb = typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10) || 0;
  }

  // 仅在「本次是回退 + 样本够 + 率超阈值」时评估告警
  if (source !== 'fallback' || total < MIN_SAMPLE) return;
  const rate = fb / total;
  if (rate <= ALERT_RATE) return;

  // 冷却锁:NX 抢到才发,避免每次回退都刷屏
  const lockKey = `${base}:alerted`;
  const got = await redis.set(lockKey, '1', { nx: true, ex: ALERT_COOLDOWN_S });
  if (!got || !feishuConfigured()) return;

  await sendFeishuText(
    `⚠️ CyberFate AI 回退率告警\n` +
      `模块:${mod}\n` +
      `今日回退 ${fb}/${total} = ${(rate * 100).toFixed(0)}%(阈值 ${(ALERT_RATE * 100).toFixed(0)}%)\n` +
      `模型链路可能不稳定,请检查 provider 可用性/额度(/admin AI 模型)。\n` +
      `(北京 ${date};约 ${Math.round(getSecondsUntilBeijingMidnight() / 3600)}h 后跨日归零;1h 内不重复告警)`,
  );
}

// T9 · AI 回退可观测 + 告警
// 各模块 AI 解读函数返回 _source('deepseek'|'fallback'|'cache')。
// 'fallback' = 模型链路失败、返回模板兜底 —— 模型不稳定的信号。
// 这里按「模块 × 北京日」在 Redis 累计 total / fallback 计数,回退率超阈值时飞书告警(带冷却去重)。
// 全程旁路执行(after()/fire-and-forget),绝不抛错/阻塞主解读流程;
// Redis 侧一次 pipeline 打完,不在用户响应路径上串跨区往返。

import { after } from 'next/server';
import { getRedis } from '@/lib/cache/redis';
import { getTodayBeijing, getSecondsUntilBeijingMidnight } from '@/lib/timezone';
import { sendFeishuText, feishuConfigured } from '@/lib/feishu';

export type AiSource = 'deepseek' | 'fallback' | 'cache';

const MIN_SAMPLE = 20; // 样本不足不评率,避免小样本抖动误报
const ALERT_RATE = 0.3; // 当日回退率 > 30% 触发告警
const ALERT_COOLDOWN_S = 3600; // 同模块同日 1 小时内不重复告警
const COUNTER_TTL_S = 172800; // 计数键留 2 天便于排查

/**
 * 记录一次 AI 解读产出的来源(不阻塞调用方)。
 * cache 命中不计入分母(未打模型,不反映稳定性)。
 *
 * 调度方式:优先 next/server 的 after() —— 遥测是纯旁路,一帧都不该占用户的响应时间,
 * 交给 after() 意味着它在响应关闭后才跑,且在 Vercel 上映射到 waitUntil,实例不会带着未完成的
 * 游离 Promise 被冻结(裸 void promise 在 Serverless 上有这个丢数据风险)。
 * 拿不到请求上下文/waitUntil 的环境(脚本、单测、非 Next 运行时)after() 会同步抛错 ——
 * 退回原来的 void + catch,行为不比改造前差。
 */
export function observeAiOutcome(mod: string, source: AiSource): void {
  if (source === 'cache') return;
  const run = () =>
    recordAiOutcome(mod, source).catch(() => {
      /* 观测失败绝不影响主流程 */
    });
  try {
    // after() 若要抛错(无请求上下文 / 无 waitUntil)一定发生在任务入队之前,
    // 所以 catch 里再跑一次不会造成重复计数
    after(run);
  } catch {
    void run();
  }
}

/**
 * 包装器:记录 obj._source 后原样返回,便于在多 return 点一行接入。
 * 用法:`return observed('bazi', { ...data, _source: 'deepseek' })`
 */
export function observed<T extends { _source: AiSource }>(mod: string, obj: T): T {
  observeAiOutcome(mod, obj._source);
  return obj;
}

/** 观测记录的可 await 内核(observeAiOutcome 的实现;导出供流式路由在 after 收尾里直接 await)。 */
export async function recordAiOutcome(mod: string, source: AiSource): Promise<void> {
  if (source === 'cache') return;
  const redis = getRedis();
  if (!redis) return;

  const date = getTodayBeijing();
  const base = `ai:obs:${mod}:${date}`;
  const totalKey = `${base}:total`;
  const fbKey = `${base}:fallback`;
  const isFallback = source === 'fallback';

  // 计数 + 补 TTL 合并成一条 pipeline:原实现每次调用 2~4 次串行 REST 往返
  // (deepseek 分支 = incr + 首日 expire + get;fallback 分支 = incr/expire ×2 —— 两分支互斥,不相加),
  // 合并后恒为 1 次。下方告警冷却锁的 set 仍是独立一次往返,不在本次合并范围内。
  // 跨区往返(hkg1 → 东京)是 Upstash 的支配性成本,批到一次请求里发是唯一能压的量级。
  //
  // 两处等价性说明,别退回旧写法:
  // 1) 原 `if (total === 1) expire(...)` 依赖 INCR 的返回值,而 pipeline 内读不到前序结果。
  //    改用 EXPIRE ... NX(仅在键当前无 TTL 时设置):新建键必然无 TTL → 照样设上;
  //    已有 TTL 的键 NX 不生效 → 不会把窗口滑成「永不过期」。语义等价,且能自愈历史遗留的无 TTL 键。
  //    (无条件 expire 是错的:每次调用都重置 2 天 TTL,计数键将永远不过期。)
  // 2) 原非回退分支会 `get(fbKey)` 拿回退数,但紧接着的 `source !== 'fallback'` 分支直接 return,
  //    这个值从未被用到 —— 纯死往返,直接删掉。
  const pipe = redis.pipeline().incr(totalKey).expire(totalKey, COUNTER_TTL_S, 'nx');
  if (isFallback) pipe.incr(fbKey).expire(fbKey, COUNTER_TTL_S, 'nx');
  const results = await pipe.exec<number[]>();

  // 仅在「本次是回退 + 样本够 + 率超阈值」时评估告警
  if (!isFallback) return;
  const total = Number(results[0]) || 0;
  const fb = Number(results[2]) || 0;
  if (total < MIN_SAMPLE) return;
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

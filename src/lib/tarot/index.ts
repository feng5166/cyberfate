// 塔罗服务端共享逻辑：牌阵配置、名称、配额。
// 收敛 draw-cards 与 draw 两个端点里原先逐字重复的 spreadConfig / DAILY_LIMITS /
// resolveSpread / quotaLabel / atomicCheckAndUseQuota，避免「改一处漏几处」。

import { prisma } from '@/lib/db';
import { getTodayBeijing } from '@/lib/timezone';

export type TarotSpread = 'single' | 'three' | 'celtic' | 'moonlight' | 'mirror' | 'relationship';

export const SPREAD_CONFIG: Record<TarotSpread, { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: {
    count: 10,
    positions: [
      '①现状', '②挑战', '③意识', '④根源', '⑤希望/恐惧',
      '⑥近期发展', '⑦可能结果', '⑧外部环境', '⑨心态信念', '⑩最终结局',
    ],
  },
  moonlight: { count: 3, positions: ['身心灵', '潜意识', '指引'] },
  mirror: { count: 5, positions: ['现状', '阻碍', '建议', '风险', 'Outcome'] },
  relationship: { count: 5, positions: ['你的感受', '对方感受', '关系基础', '当前障碍', '关系走向'] },
};

// 统一的牌阵名称（含分享文案），杜绝多处各写一份导致漂移
const SPREAD_LABELS: Record<TarotSpread, { full: string; short: string; share: string }> = {
  single: { full: '单张牌', short: '单张牌', share: '单张牌' },
  three: { full: '经典三张牌（过去/现在/未来）', short: '三张牌', share: '经典三张牌' },
  celtic: { full: '凯尔特十字', short: '凯尔特十字', share: '凯尔特十字' },
  moonlight: { full: '月光模式·柔和内省', short: '月光模式', share: '月光模式' },
  mirror: { full: '镜像模式·多角度透视', short: '镜像模式', share: '镜像模式' },
  relationship: { full: '关系牌阵·双方视角', short: '关系牌阵', share: '关系牌阵' },
};

export function resolveSpread(value: unknown): TarotSpread {
  if (
    value === 'single' || value === 'three' || value === 'celtic' ||
    value === 'moonlight' || value === 'mirror' || value === 'relationship'
  ) {
    return value;
  }
  return 'three';
}

export function spreadLabel(spread: TarotSpread): string {
  return SPREAD_LABELS[spread].full;
}
export function quotaLabel(spread: TarotSpread): string {
  return SPREAD_LABELS[spread].short;
}
export function shareSpreadName(spread: TarotSpread): string {
  return SPREAD_LABELS[spread].share;
}

// —— 配额 ——
// UsageQuota 表仅有 tarotSingleCount + tarotThreeCount 两个计数字段：
//   single 独立计数；three / moonlight / mirror / relationship 共用 tarotThreeCount。
// 因此免费用户每天 = 1 次单张 + 1 次「任意进阶牌阵」（不是每种各 1 次）。
// celtic 为 VIP 专属，走单独闸，不进配额。若将来要「每种各 1 次」，需在 schema 加字段。
const TAROT_DAILY_LIMIT = 1;

export function tarotQuotaField(spread: TarotSpread): 'tarotSingleCount' | 'tarotThreeCount' {
  return spread === 'single' ? 'tarotSingleCount' : 'tarotThreeCount';
}

/** 只读预检：true = 今日还有额度（不扣减，供 draw-cards 提前拦截 UX） */
export async function peekTarotQuota(userId: string, spread: TarotSpread): Promise<boolean> {
  const today = getTodayBeijing();
  const quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  const used = spread === 'single' ? (quota?.tarotSingleCount ?? 0) : (quota?.tarotThreeCount ?? 0);
  return used < TAROT_DAILY_LIMIT;
}

/** 原子扣减：true = 扣减成功（仍有额度）；false = 已达上限。并发安全（updateMany 条件计数） */
export async function chargeTarotQuota(userId: string, spread: TarotSpread): Promise<boolean> {
  const today = getTodayBeijing();
  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });
  const result = spread === 'single'
    ? await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotSingleCount: { lt: TAROT_DAILY_LIMIT } },
        data: { tarotSingleCount: { increment: 1 } },
      })
    : await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotThreeCount: { lt: TAROT_DAILY_LIMIT } },
        data: { tarotThreeCount: { increment: 1 } },
      });
  return result.count > 0;
}

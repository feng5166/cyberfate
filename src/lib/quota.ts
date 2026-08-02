// 配额管理工具
import { prisma } from '@/lib/db'
import { isVip as isUserVip } from '@/lib/subscription'
import { getTodayBeijing } from '@/lib/timezone'

// BUG-010: VIP 判断统一使用 subscription.ts 的 isVip（re-exported as isUserVip）
export { isUserVip }

type QuotaField =
  | 'baziAiCount'
  | 'liuyaoCount'
  | 'meihuaDecideCount'
  | 'dailyCount'
  // —— 统一配额策略 v1 新增 ——
  | 'huangliCount'
  | 'musicCount'
  | 'marriageCount'
  | 'meihuaDrawCount'
  | 'dailyQaCount'
  | 'liuyaoQaCount'
  | 'meihuaQaCount'
  | 'marriageQaCount'
  | 'tarotSingleCount'
  | 'tarotThreeCount'
  // —— 八字 V2（PRD-BAZI-V2）——
  | 'baziChatCount'
  // —— 紫微 V2（PRD-ZIWEI-V2）：逐宫 AI 解读，免费 3 宫/日 ——
  | 'ziweiAiCount'

/**
 * 统一配额策略 v1：免费用户「主命理 AI 解读」与「AI 问答」统一 1 次/天，VIP 不限。
 */
export const FREE_DAILY_LIMIT = 1

export async function atomicCheckAndConsume(
  userId: string,
  field: QuotaField,
  limit: number,
  vipStatus?: boolean
): Promise<{ hasQuota: boolean; limit: number; isVip: boolean }> {
  const vip = vipStatus !== undefined ? vipStatus : await isUserVip(userId)

  if (vip) {
    return { hasQuota: true, limit: -1, isVip: true }
  }

  const today = getTodayBeijing()

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    })

    return tx.usageQuota.updateMany({
      where: { userId, date: today, [field]: { lt: limit } } as any,
      data: { [field]: { increment: 1 } } as any,
    })
  })

  return { hasQuota: updated.count > 0, limit, isVip: false }
}

/**
 * 检查并原子扣减用户今日八字 AI 解读配额
 * 使用 updateMany 原子操作消除并发竞态：count === 0 表示已达限额
 */
export async function checkBaziQuota(userId: string): Promise<{
  hasQuota: boolean
  limit: number
  isVip: boolean
}> {
  return atomicCheckAndConsume(userId, 'baziAiCount', 1)
}

/**
 * 使用八字 AI 解读配额（复用 checkBaziQuota 原子操作）
 */
export async function useBaziQuota(userId: string): Promise<boolean> {
  const result = await checkBaziQuota(userId)
  return result.hasQuota
}

/**
 * 仅检查八字配额（不扣减），用于 fallback 场景的预检
 */
export async function peekBaziQuota(userId: string, vipStatus?: boolean): Promise<{ hasQuota: boolean; isVip: boolean }> {
  const vip = vipStatus !== undefined ? vipStatus : await isUserVip(userId)

  if (vip) {
    return { hasQuota: true, isVip: true }
  }

  const today = getTodayBeijing()
  const limit = 1
  const quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date: today } }
  })

  const used = quota?.baziAiCount ?? 0
  return { hasQuota: used < limit, isVip: false }
}

/**
 * 仅扣减八字配额（不检查），配合 peekBaziQuota 使用
 */
export async function deductBaziQuota(userId: string): Promise<void> {
  const today = getTodayBeijing()
  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: { baziAiCount: { increment: 1 } },
    create: { userId, date: today, baziAiCount: 1 },
  })
}

/**
 * 六爻 AI：免费 1 次/天，VIP 不限
 */
export async function checkLiuyaoQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'liuyaoCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 梅花决策 AI：免费 1 次/天，VIP 不限
 */
export async function checkMeihuaDecideQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'meihuaDecideCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 每日运势 AI：免费 1 次/天，VIP 不限
 */
export async function checkDailyQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'dailyCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 黄历 AI 问答：免费 1 次/天，VIP 不限
 */
export async function checkHuangliQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'huangliCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 梅花起卦 AI 解读：免费 1 次/天，VIP 不限（与决策/问答各自独立计数）
 */
export async function checkMeihuaDrawQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'meihuaDrawCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 音乐运势签：免费登录用户 1 次/天，VIP 不限（游客走 IP 限流，另行处理）
 */
export async function checkMusicQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'musicCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 合婚 AI：免费 1 次/天（独立额度，不再共享八字），VIP 不限
 */
export async function checkMarriageQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'marriageCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * AI 问答类（每日/六爻/梅花/合婚问答）：免费 1 次/天，VIP 不限。
 */
export async function checkDailyQaQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'dailyQaCount', FREE_DAILY_LIMIT, vipStatus)
}

export async function checkLiuyaoQaQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'liuyaoQaCount', FREE_DAILY_LIMIT, vipStatus)
}

export async function checkMeihuaQaQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'meihuaQaCount', FREE_DAILY_LIMIT, vipStatus)
}

export async function checkMarriageQaQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'marriageQaCount', FREE_DAILY_LIMIT, vipStatus)
}

/**
 * 退还配额（fallback 时使用）
 */
export async function refundQuota(userId: string, field: QuotaField): Promise<void> {
  const today = getTodayBeijing()
  await prisma.usageQuota.updateMany({
    where: { userId, date: today, [field]: { gt: 0 } } as any,
    data: { [field]: { decrement: 1 } } as any,
  })
}

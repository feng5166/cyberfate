// 配额管理工具
import { prisma } from '@/lib/db'
import { isVip as isUserVip } from '@/lib/subscription'
import { getTodayBeijing } from '@/lib/timezone'

// BUG-010: VIP 判断统一使用 subscription.ts 的 isVip（re-exported as isUserVip）
export { isUserVip }

type QuotaField = 'baziAiCount' | 'liuyaoCount' | 'meihuaDecideCount' | 'dailyCount'

async function atomicCheckAndConsume(
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
 * 六爻 AI：免费 3 次/天，VIP 不限
 */
export async function checkLiuyaoQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'liuyaoCount', 3, vipStatus)
}

/**
 * 梅花决策 AI：免费 3 次/天，VIP 不限
 */
export async function checkMeihuaDecideQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'meihuaDecideCount', 3, vipStatus)
}

/**
 * 每日运势 AI：免费 3 次/天，VIP 不限
 */
export async function checkDailyQuota(userId: string, vipStatus?: boolean) {
  return atomicCheckAndConsume(userId, 'dailyCount', 3, vipStatus)
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

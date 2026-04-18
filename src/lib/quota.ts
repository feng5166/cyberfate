// 配额管理工具
import { prisma } from '@/lib/db'

/**
 * 检查并原子扣减用户今日八字 AI 解读配额
 * 使用 updateMany 原子操作消除并发竞态：count === 0 表示已达限额
 */
export async function checkBaziQuota(userId: string): Promise<{
  hasQuota: boolean
  limit: number
  isVip: boolean
}> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() }
    }
  })

  if (subscription) {
    return { hasQuota: true, limit: -1, isVip: true }
  }

  const today = new Date().toISOString().split('T')[0]
  const limit = 1

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today, baziAiCount: 0 },
    })

    return tx.usageQuota.updateMany({
      where: { userId, date: today, baziAiCount: { lt: limit } },
      data: { baziAiCount: { increment: 1 } },
    })
  })

  return { hasQuota: updated.count > 0, limit, isVip: false }
}

/**
 * 使用八字 AI 解读配额（复用 checkBaziQuota 原子操作）
 */
export async function useBaziQuota(userId: string): Promise<boolean> {
  const result = await checkBaziQuota(userId)
  return result.hasQuota
}

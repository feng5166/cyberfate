// 配额管理工具
import { prisma } from '@/lib/db'

// BUG-031: 用北京时间 (UTC+8) 计算日期，避免 0:00-7:59 算成昨天
function getBeijingDateString(): string {
  const now = new Date()
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return beijingTime.toISOString().split('T')[0]
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

  const today = getBeijingDateString()
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

/**
 * 仅检查八字配额（不扣减），用于 fallback 场景的预检
 */
export async function peekBaziQuota(userId: string): Promise<{ hasQuota: boolean; isVip: boolean }> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() }
    }
  })

  if (subscription) {
    return { hasQuota: true, isVip: true }
  }

  const today = getBeijingDateString()
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
  const today = getBeijingDateString()
  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: { baziAiCount: { increment: 1 } },
    create: { userId, date: today, baziAiCount: 1 },
  })
}

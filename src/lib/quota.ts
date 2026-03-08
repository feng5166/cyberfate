// 配额管理工具
import { prisma } from '@/lib/db'

/**
 * 检查用户今日八字 AI 解读配额
 */
export async function checkBaziQuota(userId: string): Promise<{
  hasQuota: boolean
  used: number
  limit: number
  isVip: boolean
}> {
  // 检查是否 VIP
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gte: new Date() }
    }
  })
  
  const isVip = !!subscription
  
  // VIP 无限制
  if (isVip) {
    return { hasQuota: true, used: 0, limit: -1, isVip: true }
  }
  
  // 免费用户：每日 1 次
  const today = new Date().toISOString().split('T')[0]
  
  let quota = await prisma.usageQuota.findUnique({
    where: {
      userId_date: { userId, date: today }
    }
  })
  
  if (!quota) {
    quota = await prisma.usageQuota.create({
      data: { userId, date: today, baziAiCount: 0 }
    })
  }
  
  const limit = 1
  const hasQuota = quota.baziAiCount < limit
  
  return { hasQuota, used: quota.baziAiCount, limit, isVip: false }
}

/**
 * 使用八字 AI 解读配额
 */
export async function useBaziQuota(userId: string): Promise<boolean> {
  const check = await checkBaziQuota(userId)
  
  if (!check.hasQuota) {
    return false
  }
  
  // VIP 不记录
  if (check.isVip) {
    return true
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  await prisma.usageQuota.upsert({
    where: {
      userId_date: { userId, date: today }
    },
    update: {
      baziAiCount: { increment: 1 }
    },
    create: {
      userId,
      date: today,
      baziAiCount: 1
    }
  })
  
  return true
}

import { prisma } from '@/lib/db'

const FREE_BAZI_AI_LIMIT = 1

export async function isVip(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() },
    },
  })
  return sub !== null
}

export async function getSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() },
    },
    orderBy: { expireAt: 'desc' },
  })
}

export async function checkQuota(userId: string): Promise<{
  date: string
  baziAiCount: number
  limit: number
  hasQuota: boolean
}> {
  const vip = await isVip(userId)
  const date = new Date().toISOString().slice(0, 10)
  const limit = vip ? Infinity : FREE_BAZI_AI_LIMIT

  const quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date } },
  })

  const baziAiCount = quota?.baziAiCount ?? 0
  const hasQuota = vip || baziAiCount < FREE_BAZI_AI_LIMIT

  return {
    date,
    baziAiCount,
    limit,
    hasQuota,
  }
}

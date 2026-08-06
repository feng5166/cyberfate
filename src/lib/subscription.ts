import { prisma } from '@/lib/db'
import { getTodayBeijing } from '@/lib/timezone'

// 免费八字 AI 额度：与 quota.ts 的 FREE_DAILY_LIMIT 是同一份策略（统一配额策略 v1，1 次/天）。
// 不直接 import quota.FREE_DAILY_LIMIT 是因为 quota.ts 已 import 本模块的 isVip，
// 反向再引会形成循环依赖（本模块被先加载时会撞 TDZ）。改额度时两处必须一起改。
export const FREE_BAZI_AI_LIMIT = 1

const vipCache = new Map<string, { value: boolean; expires: number }>()
// 进程内缓存容量上限：长驻实例（本地 dev / 自托管）下条目只增不减会缓慢吃内存；
// 超限直接清空 —— 30s TTL 下重建成本可忽略，不值得上 LRU
const VIP_CACHE_MAX_ENTRIES = 5000

export async function isVip(userId: string): Promise<boolean> {
  const cached = vipCache.get(userId)
  if (cached && cached.expires > Date.now()) return cached.value
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expireAt: { gt: new Date() },
    },
  })
  const result = sub !== null
  if (vipCache.size >= VIP_CACHE_MAX_ENTRIES) vipCache.clear()
  vipCache.set(userId, { value: result, expires: Date.now() + 30000 })
  return result
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

/**
 * 只读当日八字用量（不判 VIP）。
 * 给「已经拿到订阅对象」的调用方用：避免 checkQuota 内部再查一次 subscription（同一份数据查两遍），
 * 同时让订阅查询与用量查询可以并行。
 */
export async function getBaziUsage(userId: string): Promise<{ date: string; baziAiCount: number }> {
  const date = getTodayBeijing()
  const quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date } },
  })
  return { date, baziAiCount: quota?.baziAiCount ?? 0 }
}

export async function checkQuota(userId: string): Promise<{
  date: string
  baziAiCount: number
  limit: number
  hasQuota: boolean
}> {
  const vip = await isVip(userId)
  const date = getTodayBeijing()
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

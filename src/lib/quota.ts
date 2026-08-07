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
  // vipStatus 只是调用方给的「快速否定信号」，绝不能当放行凭证：
  // 它来自 JWT —— Web 侧 5 分钟 DB TTL，移动端 Bearer token MAX_AGE 30 天且 getAuthSession
  // 只 decode 不查库，订阅到期后 isSubscribed:true 会一直固化到 token 过期。
  // 拿它直接放行 = 白送几十天无限 AI 且 UsageQuota 计数为 0 完全无感。
  // 故「声明是 VIP」或「没声明」时一律真查 DB 确认；isVip 内部有 30s 进程缓存，
  // 热路径基本命中缓存，不会退回「每请求一次跨区订阅查询」。
  // 只有明确的 vipStatus === false 才可信任（它是保守方向），此时走快速免费用户路径，
  // 「刚付费但 JWT 未刷」的反向误判由下方额度耗尽时的复核兜底。
  const vip = vipStatus === false ? false : await isUserVip(userId)

  if (vip) {
    return { hasQuota: true, limit: -1, isVip: true }
  }

  const today = getTodayBeijing()

  const consume = () =>
    prisma.usageQuota.updateMany({
      where: { userId, date: today, [field]: { lt: limit } } as any,
      data: { [field]: { increment: 1 } } as any,
    })

  // 热路径：当日行已存在时，一次条件自增（本身原子）就完成「检查+扣减」，
  // 不再包交互式 $transaction —— hkg1↔DB 跨区场景下事务会把 1 次往返膨胀成 4 次
  let updated = await consume()

  if (updated.count === 0) {
    // 行不存在（当日首次请求）或额度已尽，无法区分：upsert 建行（已存在则空更新，天然幂等）后重试一次
    await prisma.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    })
    updated = await consume()
  }

  if (updated.count === 0 && vipStatus === false) {
    // 边缘兜底：调用方传的 vipStatus 来自 JWT（5 分钟 DB TTL），「刚付费但 JWT 未刷」会被误判为免费用户。
    // 仅在声明非 VIP 且额度耗尽时真查一次 DB 复核 —— 常规路径零额外查询，边缘路径多一次
    if (await isUserVip(userId)) {
      return { hasQuota: true, limit: -1, isVip: true }
    }
  }

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
  // 限额统一走 FREE_DAILY_LIMIT：此处原本写死字面量 1，与 /api/quota/bazi 上报的常量分家，
  // 改额度时容易只改一处 → 「查询显示 3 次、实际扣到 1 次就没了」
  return atomicCheckAndConsume(userId, 'baziAiCount', FREE_DAILY_LIMIT)
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
  // 同 atomicCheckAndConsume：vipStatus 只信 false（快速否定），声明 VIP 一律 DB 复核，
  // 否则陈旧 token 会让接口对外报「不限量」，前端据此放开入口
  const vip = vipStatus === false ? false : await isUserVip(userId)

  if (vip) {
    return { hasQuota: true, isVip: true }
  }

  const today = getTodayBeijing()
  const limit = FREE_DAILY_LIMIT
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

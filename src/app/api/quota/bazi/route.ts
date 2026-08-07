import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FREE_DAILY_LIMIT, isUserVip, peekBaziQuota } from '@/lib/quota'

/**
 * GET /api/quota/bazi —— 只读查询今日八字 AI 配额。
 * 原实现复用 checkBaziQuota，导致「查一下剩余次数」把额度真扣掉了（前端刷新即掉一次）。
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  // 会员态取自 JWT（isSubscribed），常规路径零额外查询
  const peek = await peekBaziQuota(userId, session.user.isSubscribed)
  // 边缘兜底：JWT 声明非 VIP 且额度显示已尽时，复核一次真实订阅态（刚付费但 JWT 未刷新）
  const isVip = peek.isVip || (!peek.hasQuota && (await isUserVip(userId)))

  return NextResponse.json({
    hasQuota: peek.hasQuota || isVip,
    limit: isVip ? -1 : FREE_DAILY_LIMIT,
    isVip,
  })
}

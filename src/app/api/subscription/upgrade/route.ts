import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config'

const planRankMap: Record<string, number> = {
  daily: 1,
  yearly: 2,
  lifetime: 3,
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { new_plan } = await req.json()
  if (!['daily', 'lifetime', 'yearly'].includes(new_plan)) {
    return NextResponse.json({ error: '无效的套餐' }, { status: 400 })
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
      expireAt: { gt: new Date() },
    },
    orderBy: { expireAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json({ error: '当前无有效订阅，请先开通' }, { status: 400 })
  }

  const currentRank = planRankMap[subscription.plan] ?? 0
  const newRank = planRankMap[new_plan] ?? 0

  if (newRank <= currentRank) {
    return NextResponse.json({ error: '升级只能选择更高档套餐，降级请使用降级接口' }, { status: 400 })
  }

  const now = new Date()
  const remainingDays = Math.max(0, Math.ceil((subscription.expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const currentDuration = PRICING_CONFIG[subscription.plan as PlanId].duration
  const currentPrice = PRICING_CONFIG[subscription.plan as PlanId].amount / 100
  const newPrice = PRICING_CONFIG[new_plan as PlanId].amount / 100

  const remainingValue = currentPrice * (remainingDays / currentDuration)
  const proratedAmount = Math.max(0, Math.round((newPrice - remainingValue) * 100) / 100)

  const newDuration = PRICING_CONFIG[new_plan as PlanId].duration
  const newExpireAt = new Date(now.getTime() + newDuration * 24 * 60 * 60 * 1000)

  // MVP Mock: 直接完成升级，跳过真实支付
  const outTradeNo = `CF-UP-${Date.now()}${Math.random().toString(36).slice(2, 9)}`

  await prisma.order.create({
    data: {
      userId: session.user.id,
      plan: new_plan,
      amount: Math.round(proratedAmount * 100),
      payMethod: subscription.paymentMethod ?? 'stripe',
      outTradeNo,
      status: 'paid',
      paidAt: now,
    },
  })

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: new_plan,
      startAt: now,
      expireAt: newExpireAt,
      cancelAtPeriodEnd: false,
      pendingPlan: null,
      pendingPlanDate: null,
    },
  })

  return NextResponse.json({
    ok: true,
    prorated_amount: proratedAmount,
    effective_date: now.toISOString().slice(0, 10),
    new_period_start: now.toISOString(),
    new_period_end: newExpireAt.toISOString(),
    message: `已升级到${new_plan === 'yearly' ? '尊享版' : '专业版'}，新周期即刻生效`,
  })
}

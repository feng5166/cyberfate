import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config'

const planRankMap: Record<string, number> = {
  daily: 1,
  lifetime: 2,
  yearly: 3,
}

function getPlanDisplayName(plan: string): string {
  const config = PRICING_CONFIG[plan as PlanId]
  return config ? `${config.name}（${config.period}卡）` : plan
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { new_plan, cancel } = await req.json()

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
      expireAt: { gt: new Date() },
    },
    orderBy: { expireAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json({ error: '当前无有效订阅' }, { status: 400 })
  }

  // 撤销降级预约
  if (cancel === true) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { pendingPlan: null, pendingPlanDate: null },
    })
    return NextResponse.json({
      ok: true,
      message: '已撤销降级预约',
    })
  }

  if (!['daily', 'lifetime', 'yearly'].includes(new_plan)) {
    return NextResponse.json({ error: '无效的套餐' }, { status: 400 })
  }

  const currentRank = planRankMap[subscription.plan] ?? 0
  const newRank = planRankMap[new_plan] ?? 0

  if (newRank >= currentRank) {
    return NextResponse.json({ error: '降级只能选择更低档套餐' }, { status: 400 })
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      pendingPlan: new_plan,
      pendingPlanDate: subscription.expireAt,
    },
  })

  return NextResponse.json({
    ok: true,
    effective_date: subscription.expireAt.toISOString().slice(0, 10),
    new_plan_name: getPlanDisplayName(new_plan),
    message: `将于 ${subscription.expireAt.toISOString().slice(0, 10)} 切换为${getPlanDisplayName(new_plan)}`,
  })
}

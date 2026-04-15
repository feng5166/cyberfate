import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const planRankMap: Record<string, number> = {
  monthly: 1,
  quarterly: 2,
  yearly: 3,
}

const planNameMap: Record<string, string> = {
  monthly: '基础版（月卡）',
  quarterly: '专业版（季卡）',
  yearly: '尊享版（年卡）',
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

  if (!['monthly', 'quarterly', 'yearly'].includes(new_plan)) {
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
    new_plan_name: planNameMap[new_plan],
    message: `将于 ${subscription.expireAt.toISOString().slice(0, 10)} 切换为${planNameMap[new_plan]}`,
  })
}

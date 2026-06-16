import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';

const planRankMap: Record<string, number> = {
  daily: 1,
  yearly: 2,
  lifetime: 3,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // 取最新订阅（不限 expireAt），用于检测过期 + pendingPlan 是否需要落地
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    // H1: pendingPlan 落地。当订阅已到期且预约切换日已到，套用 pendingPlan 并刷新周期。
    if (
      subscription &&
      subscription.expireAt <= now &&
      subscription.pendingPlan &&
      subscription.pendingPlanDate &&
      subscription.pendingPlanDate <= now
    ) {
      const pendingPlan = subscription.pendingPlan as PlanId;
      const planConfig = PRICING_CONFIG[pendingPlan];
      if (planConfig) {
        const startAt = subscription.pendingPlanDate;
        const newExpireAt = new Date(startAt.getTime() + planConfig.duration * 24 * 60 * 60 * 1000);
        const isDowngrade =
          (planRankMap[pendingPlan] ?? 0) < (planRankMap[subscription.plan] ?? 0);

        if (isDowngrade && newExpireAt > now) {
          subscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              plan: pendingPlan,
              startAt,
              expireAt: newExpireAt,
              pendingPlan: null,
              pendingPlanDate: null,
            },
          });
        } else {
          // 上调或新周期已过期：仅清挂起字段，避免 stale 状态
          subscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { pendingPlan: null, pendingPlanDate: null },
          });
        }
      }
    }

    // 二次校验是否仍有效
    if (!subscription || subscription.expireAt <= now) {
      return NextResponse.json({
        subscribed: false,
        plan: null,
      });
    }

    const planId = subscription.plan as PlanId;
    const config = PRICING_CONFIG[planId];

    return NextResponse.json({
      subscribed: true,
      plan: subscription.plan,
      plan_name: config ? `${config.name}（${config.period}卡）` : subscription.plan,
      price: config ? config.amount / 100 : 0,
      currency: config?.currency?.toUpperCase() || 'USD',
      status: subscription.status,
      current_period_start: subscription.startAt.toISOString(),
      current_period_end: subscription.expireAt.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      pending_plan: subscription.pendingPlan,
      pending_plan_date: subscription.pendingPlanDate?.toISOString() || null,
      auto_renew: subscription.autoRenew && !subscription.cancelAtPeriodEnd,
      payment_method: subscription.paymentMethod ? {
        type: subscription.paymentMethod,
        last4: subscription.paymentMethodLast4 || '****'
      } : null
    });

  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: '获取订阅信息失败' },
      { status: 500 }
    );
  }
}

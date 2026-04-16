import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户最新的有效订阅
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        expireAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        plan: null
      });
    }

    const planId = subscription.plan as PlanId;
    const config = PRICING_CONFIG[planId];

    return NextResponse.json({
      subscribed: true,
      plan: subscription.plan,
      plan_name: config ? `${config.name}（${config.period}卡）` : subscription.plan,
      price: config ? config.amount / 100 : 0,
      currency: 'CNY',
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
      { error: error.message || '获取订阅信息失败' },
      { status: 500 }
    );
  }
}

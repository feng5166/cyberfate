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

    const getPlanDisplayName = (plan: string): string => {
      const config = PRICING_CONFIG[plan as PlanId];
      return config ? `${config.name}（${config.period}卡）` : plan;
    };

    // 1. 获取支付成功的订单
    const orders = await prisma.order.findMany({
      where: { 
        userId: session.user.id,
        status: 'paid'
      },
      orderBy: { createdAt: 'desc' }
    });

    const orderInvoices = orders.map(order => ({
      id: order.id,
      date: order.createdAt.toISOString().split('T')[0],
      description: getPlanDisplayName(order.plan),
      amount: order.amount / 100,
      currency: 'CNY',
      status: 'paid',
      plan: order.plan,
      source: 'order' as const,
      createdAt: order.createdAt,
    }));

    // 2. 获取订阅记录（Stripe 直接支付流程创建的）
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: session.user.id,
        status: { in: ['active', 'expired'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 过滤掉已经有对应 Order 的订阅（避免重复）
    const orderPlanDates = new Set(
      orders.map(o => `${o.plan}-${o.createdAt.toISOString().split('T')[0]}`)
    );

    const subInvoices = subscriptions
      .filter(sub => {
        const key = `${sub.plan}-${sub.createdAt.toISOString().split('T')[0]}`;
        return !orderPlanDates.has(key);
      })
      .map(sub => {
        const planConfig = PRICING_CONFIG[sub.plan as keyof typeof PRICING_CONFIG];
        return {
          id: sub.id,
          date: sub.createdAt.toISOString().split('T')[0],
          description: getPlanDisplayName(sub.plan),
          amount: planConfig ? planConfig.amount / 100 : 0,
          currency: 'CNY',
          status: 'paid',
          plan: sub.plan,
          source: 'subscription' as const,
          createdAt: sub.createdAt,
        };
      });

    // 3. 合并并按时间排序
    const allInvoices = [...orderInvoices, ...subInvoices]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(({ createdAt, source, ...rest }) => rest);

    return NextResponse.json({ invoices: allInvoices });
    
  } catch (error: unknown) {
    console.error('Get invoices error:', error);
    const message = error instanceof Error ? error.message : '获取账单历史失败';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : null;
    const pageSize = Math.min(50, Math.max(1, parseInt(pageSizeParam || '20', 10) || 20));

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
      orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
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

    const total = allInvoices.length;

    // 不传 page 时返回全部（最多 50 条），保持向后兼容
    if (page === null) {
      return NextResponse.json({
        invoices: allInvoices.slice(0, 50),
        pagination: {
          page: 1,
          pageSize: Math.min(50, total),
          total,
          totalPages: Math.ceil(total / Math.min(50, Math.max(1, total))),
        }
      });
    }

    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    return NextResponse.json({
      invoices: allInvoices.slice(skip, skip + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      }
    });

  } catch (error: unknown) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: '获取账单历史失败' },
      { status: 500 }
    );
  }
}

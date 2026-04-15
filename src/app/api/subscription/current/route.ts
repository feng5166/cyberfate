import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // 映射 plan 名称
    const planNames = {
      monthly: '基础版（月卡）',
      quarterly: '专业版（季卡）',
      yearly: '尊享版（年卡）'
    };

    const prices = {
      monthly: 29,
      quarterly: 68,
      yearly: 238
    };

    return NextResponse.json({
      subscribed: true,
      plan: subscription.plan,
      plan_name: planNames[subscription.plan],
      price: prices[subscription.plan],
      currency: 'CNY',
      status: subscription.status,
      current_period_start: subscription.startAt.toISOString(),
      current_period_end: subscription.expireAt.toISOString(),
      cancel_at_period_end: false, // TODO: 实现取消续订后需从 subscription 表读取
      payment_method: {
        type: 'stripe', // TODO: 从订单记录读取真实支付方式
        last4: '****'
      }
    });
    
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message || '获取订阅信息失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PLAN_PRICES = {
  monthly: 2900,    // 29 元（分）
  quarterly: 6800,  // 68 元
  yearly: 23800     // 238 元
};

const PLAN_DAYS = {
  monthly: 30,
  quarterly: 90,
  yearly: 365
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_plan, action } = await req.json();

    if (!['monthly', 'quarterly', 'yearly'].includes(new_plan)) {
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 });
    }

    type PlanType = 'monthly' | 'quarterly' | 'yearly';

    // 获取用户当前有效订阅
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        expireAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({ error: '没有有效订阅' }, { status: 404 });
    }

    const currentPlan = subscription.plan as PlanType;
    const currentPrice = PLAN_PRICES[currentPlan];
    const newPrice = PLAN_PRICES[new_plan as PlanType];

    // 判断是升级还是降级
    const isUpgrade = newPrice > currentPrice;

    if (isUpgrade) {
      // 升级：计算补差价
      const now = new Date();
      const expireAt = new Date(subscription.expireAt);
      const totalDays = PLAN_DAYS[currentPlan];
      const remainingDays = Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // 补差价 = (新套餐价 - 旧套餐价) × (剩余天数 / 旧套餐总天数)
      const proratedAmount = Math.round(
        (newPrice - currentPrice) * (remainingDays / totalDays)
      );

      // TODO: 创建支付订单，返回支付链接
      // 现在先返回模拟数据
      return NextResponse.json({
        ok: true,
        action: 'upgrade',
        prorated_amount: proratedAmount / 100, // 转为元
        effective_date: now.toISOString().split('T')[0],
        requires_payment: true,
        payment_url: '/pricing', // TODO: 实际支付链接
        message: `需补差价 ¥${(proratedAmount / 100).toFixed(2)}，支付后立即生效`
      });
      
    } else {
      // 降级：预约到期后生效
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlan: new_plan as PlanType,
          pendingPlanDate: subscription.expireAt
        }
      });
      
      return NextResponse.json({
        ok: true,
        action: 'downgrade',
        effective_date: subscription.expireAt.toISOString().split('T')[0],
        message: '新套餐将在当前周期结束后生效',
        scheduled_plan: new_plan
      });
    }
    
  } catch (error: any) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: error.message || '变更套餐失败' },
      { status: 500 }
    );
  }
}

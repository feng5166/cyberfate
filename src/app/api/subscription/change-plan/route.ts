import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe-direct';
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_plan } = await req.json();

    if (!['daily', 'lifetime', 'yearly'].includes(new_plan)) {
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 });
    }

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

    const currentPlan = subscription.plan as PlanId;
    const currentPrice = PRICING_CONFIG[currentPlan].amount;
    const newPrice = PRICING_CONFIG[new_plan as PlanId].amount;

    // 判断是升级还是降级
    const isUpgrade = newPrice > currentPrice;

    if (isUpgrade) {
      // 升级：计算补差价
      const now = new Date();
      const expireAt = new Date(subscription.expireAt);
      const totalDays = PRICING_CONFIG[currentPlan].duration;
      const remainingDays = Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // 补差价 = 新套餐价 - 旧套餐剩余价值
      const remainingValue = Math.round(currentPrice * (remainingDays / totalDays));
      const proratedAmount = Math.max(0, newPrice - remainingValue);

      const outTradeNo = `CF${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      const newPlanConfig = PRICING_CONFIG[new_plan as PlanId];

      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          plan: new_plan,
          amount: proratedAmount,
          payMethod: 'stripe',
          outTradeNo,
          status: 'pending',
        },
      });

      const baseUrl = 'https://www.cyberfate.me';
      
      // 使用 stripe-direct 创建 checkout session
      const result = await createCheckoutSession({
        priceData: {
          currency: newPlanConfig.currency,
          unit_amount: proratedAmount,
          product_data: {
            name: `升级至${newPlanConfig.name}（补差价）`,
            description: `从${PRICING_CONFIG[currentPlan].name}升级`,
          },
        },
        quantity: 1,
        successUrl: `${baseUrl}/payment/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/pricing`,
        customerEmail: session.user.email || undefined,
        metadata: {
          orderId: order.id,
          plan: new_plan,
          userId: session.user.id,
          action: 'upgrade',
          fromPlan: currentPlan,
        },
      });

      if (!result.ok || !result.data) {
        console.error('Stripe checkout error:', result.error);
        return NextResponse.json(
          { error: result.error || '创建支付会话失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        action: 'upgrade',
        prorated_amount: proratedAmount / 100,
        effective_date: now.toISOString().split('T')[0],
        requires_payment: true,
        checkout_url: result.data.url,
        orderId: order.id,
        message: `需补差价 $${(proratedAmount / 100).toFixed(2)}，支付后立即生效`
      });
      
    } else {
      // 降级：预约到期后生效
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlan: new_plan as PlanId,
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
    
  } catch (error: unknown) {
    console.error('Change plan error:', error);
    const message = error instanceof Error ? error.message : '变更套餐失败';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

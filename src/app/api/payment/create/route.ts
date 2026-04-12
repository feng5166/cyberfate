import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, STRIPE_PLANS } from '@/lib/stripe';

const planPrices = {
  monthly: 500,    // 5元/月
  quarterly: 500,  // 5元/季
  yearly: 500,     // 5元/年
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { plan, payMethod } = await req.json();

  if (!['monthly', 'quarterly', 'yearly'].includes(plan)) {
    return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const amount = planPrices[plan as keyof typeof planPrices];
  const outTradeNo = `CF${Date.now()}${Math.random().toString(36).slice(2, 9)}`;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      plan,
      amount,
      payMethod,
      outTradeNo,
      status: 'pending',
    },
  });

  if (payMethod === 'stripe') {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    const stripePlan = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
    
    try {
      // 动态创建 Checkout Session（使用实际价格）
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cny',
              product_data: {
                name: stripePlan.name,
                description: `有效期 ${stripePlan.duration} 天`,
              },
              unit_amount: amount, // 使用 planPrices 的实际价格（分）
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${order.id}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
        client_reference_id: order.id,
        customer_email: session.user.email,
        metadata: {
          orderId: order.id,
          userId: user.id,
          plan,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        checkoutUrl: checkoutSession.url,
      });
    } catch (error) {
      console.error('[Stripe] 创建 Checkout Session 失败:', error);
      return NextResponse.json({ error: 'Stripe 支付创建失败' }, { status: 500 });
    }
  }

  // MVP: 返回模拟二维码
  return NextResponse.json({
    orderId: order.id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${outTradeNo}`,
    outTradeNo,
  });
}

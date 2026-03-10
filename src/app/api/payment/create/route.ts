import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';

const planPrices = {
  monthly: 2900,
  quarterly: 6900,
  yearly: 19900,
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
    const stripePlan = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: stripePlan.currency,
            product_data: {
              name: stripePlan.name,
            },
            unit_amount: stripePlan.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel?order_id=${order.id}`,
      metadata: { orderId: order.id, userId: user.id, plan },
      customer_email: session.user.email,
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: stripeSession.url,
    });
  }

  // MVP: 返回模拟二维码
  return NextResponse.json({
    orderId: order.id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${outTradeNo}`,
    outTradeNo,
  });
}

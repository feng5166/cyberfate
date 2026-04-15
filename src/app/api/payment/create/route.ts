import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { PRICING_CONFIG, isValidPlanId } from '@/lib/pricing-config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { plan, payMethod } = await req.json();

  if (!isValidPlanId(plan)) {
    return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const planConfig = PRICING_CONFIG[plan];
  const amount = planConfig.amount;
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

    const baseUrl = 'https://www.cyberfate.me';
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: planConfig.currency,
          product_data: { name: planConfig.name },
          unit_amount: planConfig.amount,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/payment/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        orderId: order.id,
        plan,
        userId: user.id,
      },
      customer_email: user.email || undefined,
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: checkoutSession.url,
    });
  }

  // MVP: 返回模拟二维码
  return NextResponse.json({
    orderId: order.id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${outTradeNo}`,
    outTradeNo,
  });
}

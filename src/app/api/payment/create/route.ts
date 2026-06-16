import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listCustomers, createCustomer, createCheckoutSession } from '@/lib/stripe-direct';
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
  const outTradeNo = `CF${crypto.randomUUID().replace(/-/g, '')}`;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      plan,
      amount,
      currency: planConfig.currency,
      payMethod,
      outTradeNo,
      status: 'pending',
    },
  });

  if (payMethod === 'stripe') {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    // M6: 优先用 DB 里持久化的 stripeCustomerId，避免 listByEmail 选错 customer
    let customerId: string;
    if (user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      const customersRes = await listCustomers(user.email!);
      if (!customersRes.ok) {
        return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
      }

      if (customersRes.data!.data.length > 0) {
        customerId = customersRes.data!.data[0].id;
      } else {
        const customerRes = await createCustomer(
          user.email!,
          user.nickname || undefined,
          { userId: user.id },
        );
        if (!customerRes.ok) {
          return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
        }
        customerId = customerRes.data!.id;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const checkoutRes = await createCheckoutSession({
      mode: 'payment',
      customerId,
      priceData: {
        currency: planConfig.currency,
        unit_amount: amount,
        product_data: { name: planConfig.name },
      },
      quantity: 1,
      successUrl: `${baseUrl}/payment/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
      metadata: {
        orderId: order.id,
        plan,
        userId: user.id,
      },
    });

    if (!checkoutRes.ok) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: checkoutRes.data!.url,
    });
  }

  // Security Fix: SEC-013 — 生产环境禁用模拟支付
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: '请使用 Stripe 支付' }, { status: 400 });
  }

  return NextResponse.json({
    orderId: order.id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo`,
  });
}

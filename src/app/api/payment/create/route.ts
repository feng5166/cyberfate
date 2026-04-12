import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, STRIPE_PLANS } from '@/lib/stripe';

const planPrices = {
  monthly: 2900,    // 29元/月
  quarterly: 6800,  // 68元/季
  yearly: 23800,    // 238元/年
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
    // MVP Mock 支付模式：跳过真实支付，直接模拟成功
    console.log('[Payment] Mock 支付模式 - 订单:', {
      orderId: order.id,
      plan,
      amount,
      user: user.email,
    });
    
    // 模拟支付成功，更新订单状态为 paid
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'paid' },
    });
    
    // 创建或更新订阅记录
    const duration = { monthly: 30, quarterly: 90, yearly: 365 }[plan as keyof typeof planPrices];
    const now = new Date();
    const expireAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    
    // 查找现有订阅
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });
    
    if (existingSub) {
      // 更新现有订阅
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan,
          status: 'active',
          expireAt,
        },
      });
    } else {
      // 创建新订阅
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan,
          status: 'active',
          expireAt,
        },
      });
    }
    
    console.log('[Payment] Mock 支付完成 - 会员已开通至:', expireAt);
    
    // 直接返回成功页面（使用生产域名）
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';
    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: `${baseUrl}/payment/success?order_id=${order.id}&mock=true`,
      mock: true,
      message: 'Mock 支付模式：会员已自动开通',
    });
  }

  // MVP: 返回模拟二维码
  return NextResponse.json({
    orderId: order.id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${outTradeNo}`,
    outTradeNo,
  });
}

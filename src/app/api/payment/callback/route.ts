import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';

function verifyCallbackSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALLBACK_SECRET;
  if (!secret) {
    console.warn('[PaymentCallback] CALLBACK_SECRET 未配置，跳过签名验证');
    return true;
  }
  if (!signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-callback-signature');

  if (!verifyCallbackSignature(rawBody, signature)) {
    return NextResponse.json({ error: '签名验证失败' }, { status: 403 });
  }

  const { outTradeNo, transactionId } = JSON.parse(rawBody);

  const order = await prisma.order.findUnique({
    where: { outTradeNo },
  });

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  if (order.status === 'paid') {
    return NextResponse.json({ message: '订单已支付' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        transactionId,
        paidAt: new Date(),
      },
    });

    const duration = {
      daily: 30,
      lifetime: 90,
      yearly: 365,
    }[order.plan];

    const expireAt = addDays(new Date(), duration);

    await tx.subscription.create({
      data: {
        userId: order.userId,
        plan: order.plan,
        status: 'active',
        expireAt,
      },
    });
  });

  return NextResponse.json({ success: true });
}

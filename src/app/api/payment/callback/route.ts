import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000; // ±5分钟

function verifyCallbackSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALLBACK_SECRET;
  if (!secret) {
    console.error('[PaymentCallback] CALLBACK_SECRET 未配置，拒绝请求');
    return false;
  }
  if (!signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-callback-signature');

  if (!verifyCallbackSignature(rawBody, signature)) {
    return NextResponse.json({ error: '签名验证失败' }, { status: 403 });
  }

  const { outTradeNo, transactionId, timestamp } = JSON.parse(rawBody);

  // 时间戳防重放：拒绝 ±5 分钟之外的请求
  if (timestamp) {
    const age = Math.abs(Date.now() - timestamp);
    if (age > REPLAY_TOLERANCE_MS) {
      return NextResponse.json({ error: '请求已过期' }, { status: 403 });
    }
  }

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
      daily: 1,
      yearly: 365,
      lifetime: 36500,
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

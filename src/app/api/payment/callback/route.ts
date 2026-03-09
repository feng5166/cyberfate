import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { outTradeNo, transactionId } = await req.json();

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
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    }[order.plan];

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + duration);

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

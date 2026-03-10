import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const orderId = checkoutSession.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === 'paid') {
      return NextResponse.json({ message: 'Already processed' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          transactionId: checkoutSession.payment_intent as string,
          paidAt: new Date(),
        },
      });

      const duration = { monthly: 30, quarterly: 90, yearly: 365 }[order.plan];
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + duration);

      // 先让已存在的活跃订阅过期
      await tx.subscription.updateMany({
        where: { userId: order.userId, status: 'active' },
        data: { status: 'expired' },
      });

      await tx.subscription.create({
        data: {
          userId: order.userId,
          plan: order.plan,
          status: 'active',
          expireAt,
        },
      });
    });
  }

  return NextResponse.json({ received: true });
}

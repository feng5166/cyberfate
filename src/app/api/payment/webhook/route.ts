import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// 手动验证 Stripe Webhook 签名（不依赖 Stripe SDK）
function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): { valid: boolean; event?: StripeEvent; error?: string } {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const v1Signature = parts['v1'];

    if (!timestamp || !v1Signature) {
      return { valid: false, error: 'Missing signature parts' };
    }

    // 检查时间戳（5分钟容差）
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      return { valid: false, error: 'Timestamp too old' };
    }

    // 计算期望的签名
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // 比较签名
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1Signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Signature mismatch' };
    }

    const event = JSON.parse(payload) as StripeEvent;
    return { valid: true, event };
  } catch (err) {
    return { valid: false, error: `Verification error: ${err}` };
  }
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
}

interface StripeCheckoutSession {
  id: string;
  object: string;
  payment_status: string;
  metadata?: {
    orderId?: string;
    userId?: string;
    plan?: 'monthly' | 'quarterly' | 'yearly';
    action?: string;
  };
  payment_intent?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  console.log('[Webhook] Received request, signature:', sig ? 'present' : 'missing');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // 验证签名
  const verification = verifyStripeSignature(body, sig, webhookSecret);
  if (!verification.valid || !verification.event) {
    console.error('[Webhook] Signature verification failed:', verification.error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed', details: verification.error },
      { status: 400 }
    );
  }

  const event = verification.event;
  console.log('[Webhook] Event type:', event.type, 'ID:', event.id);

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object;
    const orderId = checkoutSession.metadata?.orderId;
    const userId = checkoutSession.metadata?.userId;
    const plan = checkoutSession.metadata?.plan;

    console.log('[Webhook] checkout.session.completed - orderId:', orderId, 'userId:', userId, 'plan:', plan);

    if (orderId) {
      // 通过 Order 流程处理
      console.log('[Webhook] Processing via Order flow');
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.status === 'paid') {
        console.log('[Webhook] Order already processed or not found');
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
      console.log('[Webhook] Order flow completed');
    } else if (userId && plan) {
      // Stripe 直接支付流程（无 Order）
      console.log('[Webhook] Processing via direct Stripe flow');
      
      const validPlans = ['monthly', 'quarterly', 'yearly'] as const;
      if (!validPlans.includes(plan)) {
        console.error('[Webhook] Invalid plan:', plan);
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const duration = { monthly: 30, quarterly: 90, yearly: 365 }[plan];
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + duration);

      await prisma.$transaction(async (tx) => {
        await tx.subscription.updateMany({
          where: { userId, status: 'active' },
          data: { status: 'expired' },
        });

        await tx.subscription.create({
          data: {
            userId,
            plan,
            status: 'active',
            expireAt,
          },
        });
      });
      console.log('[Webhook] Direct flow completed, subscription created for user:', userId);
    } else {
      console.error('[Webhook] No orderId or userId/plan in metadata');
      return NextResponse.json({ error: 'No orderId or userId/plan in metadata' }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}

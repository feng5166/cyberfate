import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { addDays } from 'date-fns';

// Stripe 签名验证（参考官方 SDK 实现）
function verifyStripeWebhook(
  payload: string,
  header: string,
  secret: string,
  tolerance: number = 300
): { valid: boolean; event?: StripeEvent; error?: string } {
  const details = parseSignatureHeader(header);
  
  if (!details || details.timestamp === -1) {
    return { valid: false, error: 'Unable to extract timestamp and signatures from header' };
  }
  
  if (details.signatures.length === 0) {
    return { valid: false, error: 'No signatures found with expected scheme v1' };
  }

  const expectedSignature = computeSignature(
    `${details.timestamp}.${payload}`,
    secret
  );

  const signatureFound = details.signatures.some((sig) =>
    secureCompare(sig, expectedSignature)
  );

  if (!signatureFound) {
    return { 
      valid: false, 
      error: `No signature matched. Expected: ${expectedSignature.substring(0, 20)}..., Got: ${details.signatures[0]?.substring(0, 20)}...` 
    };
  }

  const timestampAge = Math.floor(Date.now() / 1000) - details.timestamp;
  if (tolerance > 0 && timestampAge > tolerance) {
    return { valid: false, error: `Timestamp outside tolerance. Age: ${timestampAge}s` };
  }

  try {
    const event = JSON.parse(payload) as StripeEvent;
    return { valid: true, event };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON payload' };
  }
}

function parseSignatureHeader(header: string): { timestamp: number; signatures: string[] } | null {
  if (typeof header !== 'string') {
    return null;
  }

  const items = header.split(',');
  const timestamp = items
    .map((item) => item.split('='))
    .filter(([key]) => key === 't')
    .map(([, value]) => parseInt(value, 10))[0] ?? -1;
    
  const signatures = items
    .map((item) => item.split('='))
    .filter(([key]) => key === 'v1')
    .map(([, value]) => value);

  return { timestamp, signatures };
}

function computeSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
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

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // 验证签名
  const verification = verifyStripeWebhook(body, sig, webhookSecret);
  if (!verification.valid || !verification.event) {
    console.error('[Webhook] Signature verification failed:', verification.error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed', details: verification.error },
      { status: 400 }
    );
  }

  const event = verification.event;

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object;
    const orderId = checkoutSession.metadata?.orderId;
    const userId = checkoutSession.metadata?.userId;
    const plan = checkoutSession.metadata?.plan;

    if (orderId) {
      // 通过 Order 流程处理
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
        const expireAt = addDays(new Date(), duration);

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
    } else if (userId && plan) {
      // Stripe 直接支付流程（无 Order）
      const validPlans = ['monthly', 'quarterly', 'yearly'] as const;
      if (!validPlans.includes(plan)) {
        console.error('[Webhook] Invalid plan:', plan);
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const duration = { monthly: 30, quarterly: 90, yearly: 365 }[plan];
      const expireAt = addDays(new Date(), duration);

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
    } else {
      console.error('[Webhook] No orderId or userId/plan in metadata');
      return NextResponse.json({ error: 'No orderId or userId/plan in metadata' }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}

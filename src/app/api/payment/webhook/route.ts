import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import { isLifetimePlan, LIFETIME_DURATION, PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';
import { logger } from '@/lib/logger';

const SERVICE = 'api/payment/webhook';

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
    return { valid: false, error: 'Webhook signature verification failed' };
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

interface StripeCheckoutSession {
  id: string;
  object: string;
  payment_status: string;
  metadata?: {
    orderId?: string;
    userId?: string;
    plan?: 'daily' | 'lifetime' | 'yearly';
    action?: string;
  };
  payment_intent?: string;
}

interface StripeCharge {
  id: string;
  object: 'charge';
  payment_intent?: string;
  metadata?: {
    orderId?: string;
    userId?: string;
  };
}

interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer?: string;
  metadata?: {
    userId?: string;
  };
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession | StripeCharge | StripeSubscription;
  };
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error(SERVICE, 'STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // 验证签名
  const verification = verifyStripeWebhook(body, sig, webhookSecret);
  if (!verification.valid || !verification.event) {
    logger.error(SERVICE, 'Signature verification failed', undefined, { error: verification.error });
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }

  const event = verification.event;

  // BUG-008: charge.refunded → mark subscription as expired
  // Stripe 不会自动把 checkout/PaymentIntent 的 metadata 拷贝到 charge，
  // 所以用 charge.payment_intent 反查 Order.transactionId 来定位被退款的订单。
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as StripeCharge;
    const paymentIntent = charge.payment_intent;

    if (paymentIntent) {
      const order = await prisma.order.findFirst({ where: { transactionId: paymentIntent } });
      if (order) {
        // Only expire the subscription created for this specific order (startAt >= paidAt),
        // to avoid cancelling newer subscriptions the user purchased after this refunded one.
        const orderPaidAt = order.paidAt ?? order.createdAt;
        const result = await prisma.subscription.updateMany({
          where: {
            userId: order.userId,
            plan: order.plan,
            status: 'active',
            startAt: { gte: orderPaidAt },
          },
          data: { status: 'expired' },
        });
        logger.info(SERVICE, 'charge.refunded processed', { orderId: order.id, userId: order.userId, expiredCount: result.count });
      } else {
        logger.warn(SERVICE, 'charge.refunded no matching order', { paymentIntent, chargeId: charge.id });
      }
    } else {
      logger.warn(SERVICE, 'charge.refunded missing payment_intent', { chargeId: charge.id });
    }
    return NextResponse.json({ received: true });
  }

  // BUG-043 + BUG-008: customer.subscription.deleted → sync DB status
  if (event.type === 'customer.subscription.deleted') {
    const stripeSub = event.data.object as StripeSubscription;
    const userId = stripeSub.metadata?.userId;

    if (userId) {
      const result = await prisma.subscription.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'expired' },
      });
      logger.info(SERVICE, 'subscription.deleted processed', { userId, expiredCount: result.count });
    } else {
      logger.warn(SERVICE, 'subscription.deleted missing userId', { subscriptionId: stripeSub.id });
    }
    return NextResponse.json({ received: true });
  }

  // BUG-009: invoice.paid — 仅处理独立 invoice（非 checkout session），避免与 checkout.session.completed 重复创建订阅
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as { subscription?: string; metadata?: { orderId?: string; userId?: string } };
    const invoiceUserId = invoice.metadata?.userId;
    const invoiceOrderId = invoice.metadata?.orderId;

    if (invoiceOrderId) {
      // 有 orderId 说明走了 checkout 流程，checkout.session.completed 已处理，跳过
      logger.info(SERVICE, 'invoice.paid skipped (handled by checkout)', { orderId: invoiceOrderId });
      return NextResponse.json({ received: true });
    }

    if (invoiceUserId) {
      // 检查是否已存在同 invoiceId 对应的订单记录
      const invoiceId = (event.data.object as { id: string }).id;
      const existing = await prisma.order.findFirst({ where: { transactionId: invoiceId } });
      if (existing) {
        logger.info(SERVICE, 'invoice.paid duplicate skipped', { invoiceId });
        return NextResponse.json({ received: true });
      }
      logger.info(SERVICE, 'invoice.paid no matching order', { userId: invoiceUserId });
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as StripeCheckoutSession;
    const orderId = checkoutSession.metadata?.orderId;
    const userId = checkoutSession.metadata?.userId;
    const plan = checkoutSession.metadata?.plan;

    if (orderId) {
      // 通过 Order 流程处理
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.status === 'paid') {
        return NextResponse.json({ message: 'Already processed' });
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'paid',
              transactionId: checkoutSession.payment_intent as string,
              paidAt: new Date(),
            },
          });

          const duration = isLifetimePlan(order.plan) ? LIFETIME_DURATION : PRICING_CONFIG[order.plan as PlanId]?.duration ?? 1;
          // BUG-007: 续费从 max(旧expireAt, now) 开始计算，保留剩余天数
          const existingSub = await tx.subscription.findFirst({
            where: { userId: order.userId, status: 'active', expireAt: { gt: new Date() } },
            orderBy: { expireAt: 'desc' },
          });
          const baseDate = existingSub && existingSub.expireAt > new Date() ? existingSub.expireAt : new Date();
          const expireAt = addDays(baseDate, duration);

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
      } catch (err: unknown) {
        // P2002: transactionId unique constraint — duplicate event, already processed
        if ((err as { code?: string })?.code === 'P2002') {
          logger.warn(SERVICE, 'checkout.session.completed duplicate transaction', { orderId });
          return NextResponse.json({ message: 'Already processed' });
        }
        throw err;
      }
    } else if (userId) {
      // Stripe 直接支付流程（无 Order）
      // 信任服务端在 checkout 创建时写入的 metadata.plan，避免 amount_total 反推
      // （促销/proration/补差价场景下 amount_total 与 PRICING_CONFIG.amount 不一致会反推失败）
      if (!plan || !(plan in PRICING_CONFIG)) {
        logger.error(SERVICE, 'checkout.session.completed missing or invalid metadata.plan', undefined, { plan });
        return NextResponse.json({ error: 'Invalid plan in metadata' }, { status: 400 });
      }
      const resolvedPlan = plan as PlanId;

      try {
        await prisma.$transaction(async (tx) => {
          // 幂等查重：在事务内检查，防并发重复
          const existingOrder = await tx.order.findFirst({
            where: { transactionId: checkoutSession.id },
          });
          if (existingOrder) {
            return;
          }

          // 验证 userId 存在性，防止 metadata 被篡改
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            logger.error(SERVICE, 'User not found in webhook metadata', undefined, { userId });
            throw new Error('User not found');
          }

          const duration = isLifetimePlan(resolvedPlan) ? LIFETIME_DURATION : PRICING_CONFIG[resolvedPlan]?.duration ?? 1;
          // BUG-007: 续费从 max(旧expireAt, now) 开始计算，保留剩余天数
          const existingSubForUser = await tx.subscription.findFirst({
            where: { userId, status: 'active', expireAt: { gt: new Date() } },
            orderBy: { expireAt: 'desc' },
          });
          const baseDateForUser = existingSubForUser && existingSubForUser.expireAt > new Date() ? existingSubForUser.expireAt : new Date();
          const expireAt = addDays(baseDateForUser, duration);

          await tx.order.create({
            data: {
              userId,
              plan: resolvedPlan,
              amount: PRICING_CONFIG[resolvedPlan]?.amount ?? 0,
              status: 'paid',
              payMethod: 'stripe',
              transactionId: checkoutSession.id,
              paidAt: new Date(),
              outTradeNo: `WH-${checkoutSession.id}`,
            },
          });

          await tx.subscription.updateMany({
            where: { userId, status: 'active' },
            data: { status: 'expired' },
          });

          await tx.subscription.create({
            data: {
              userId,
              plan: resolvedPlan,
              status: 'active',
              expireAt,
            },
          });
        });
      } catch (err: unknown) {
        if ((err as Error)?.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 400 });
        }
        // P2002: unique constraint violation — 并发重复写入时安全忽略
        if ((err as { code?: string })?.code === 'P2002') {
          logger.warn(SERVICE, 'checkout.session.completed duplicate transaction (direct pay)', { sessionId: checkoutSession.id });
          return NextResponse.json({ message: 'Already processed' });
        }
        throw err;
      }
    } else {
      logger.error(SERVICE, 'checkout.session.completed missing orderId and userId in metadata');
      return NextResponse.json({ error: 'No orderId or userId in metadata' }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
  } catch (error) {
    logger.error(SERVICE, 'Unhandled webhook error', error instanceof Error ? error : undefined, {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}

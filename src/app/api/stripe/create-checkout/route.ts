import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { PRICING_CONFIG, isValidPlanId, type PlanId } from '@/lib/pricing-config';

const PLAN_RANK: Record<PlanId, number> = {
  monthly: 1,
  quarterly: 2,
  yearly: 3,
};

function calculateProratedAmount(
  currentPlan: PlanId,
  newPlan: PlanId,
  expireAt: Date
): number {
  const now = new Date();
  const remainingMs = expireAt.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  const currentConfig = PRICING_CONFIG[currentPlan];
  const dailyRate = currentConfig.amount / currentConfig.duration;
  const remainingValue = Math.round(dailyRate * remainingDays);

  const newConfig = PRICING_CONFIG[newPlan];
  const proratedAmount = Math.max(0, newConfig.amount - remainingValue);

  return proratedAmount;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!isValidPlanId(plan)) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const planConfig = PRICING_CONFIG[plan];
    let amount = planConfig.amount;
    let action: 'purchase' | 'upgrade' = 'purchase';

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        expireAt: { gt: new Date() },
      },
    });

    if (activeSubscription) {
      const currentPlan = activeSubscription.plan as PlanId;
      if (PLAN_RANK[plan] <= PLAN_RANK[currentPlan]) {
        return NextResponse.json(
          { error: '只能升级到更高级的套餐' },
          { status: 400 }
        );
      }
      amount = calculateProratedAmount(currentPlan, plan, activeSubscription.expireAt);
      action = 'upgrade';
    }

    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.nickname || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: `${planConfig.name} - ${planConfig.period}付`,
              description: action === 'upgrade'
                ? `从当前套餐升级到${planConfig.name}（补差价）`
                : `${planConfig.name} ${planConfig.period}付套餐`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId: user.id,
        plan,
        action,
        ...(action === 'upgrade' && activeSubscription
          ? { previousPlan: activeSubscription.plan, subscriptionId: activeSubscription.id }
          : {}),
      },
    });

    return NextResponse.json({ checkout_url: checkoutSession.url });
  } catch (error: any) {
    console.error('[Stripe create-checkout] Error:', error);
    return NextResponse.json(
      { 
        error: '创建支付会话失败',
        details: error.message || String(error),
        hint: '请检查 Stripe 配置是否正确'
      },
      { status: 500 }
    );
  }
}

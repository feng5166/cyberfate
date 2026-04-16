import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listCustomers, createCustomer, createCheckoutSession } from '@/lib/stripe-direct';
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

    if (!process.env.STRIPE_SECRET_KEY) {
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

    const customersRes = await listCustomers(user.email!);
    if (!customersRes.ok) {
      return NextResponse.json(
        { error: '查询客户失败', details: customersRes.error },
        { status: 500 }
      );
    }

    let customerId: string;
    if (customersRes.data!.data.length > 0) {
      customerId = customersRes.data!.data[0].id;
    } else {
      const customerRes = await createCustomer(
        user.email!,
        user.nickname || undefined,
        { userId: user.id },
      );
      if (!customerRes.ok) {
        return NextResponse.json(
          { error: '创建客户失败', details: customerRes.error },
          { status: 500 }
        );
      }
      customerId = customerRes.data!.id;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const description = action === 'upgrade'
      ? `从当前套餐升级到${planConfig.name}（补差价）`
      : `${planConfig.name} ${planConfig.period}付套餐`;

    const checkoutRes = await createCheckoutSession({
      mode: 'payment',
      customerId,
      priceData: {
        currency: planConfig.currency,
        unit_amount: amount,
        product_data: {
          name: `${planConfig.name} - ${planConfig.period}付`,
          description,
        },
      },
      quantity: 1,
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
      metadata: {
        userId: user.id,
        plan,
        action,
        ...(action === 'upgrade' && activeSubscription
          ? { previousPlan: activeSubscription.plan, subscriptionId: activeSubscription.id }
          : {}),
      },
    });

    if (!checkoutRes.ok) {
      return NextResponse.json(
        { error: '创建支付会话失败', details: checkoutRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkout_url: checkoutRes.data!.url });
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

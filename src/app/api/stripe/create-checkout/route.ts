import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listCustomers, createCustomer, createCheckoutSession } from '@/lib/stripe-direct';
import { PRICING_CONFIG, isValidPlanId, type PlanId } from '@/lib/pricing-config';

const PLAN_RANK: Record<PlanId, number> = {
  daily: 1,
  yearly: 2,
  lifetime: 3,
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
  // 整数运算避免浮点精度问题：先乘后除
  const remainingValue = Math.round((currentConfig.amount * remainingDays) / currentConfig.duration);

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

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const { plan, clientAmount } = await req.json();

    if (!isValidPlanId(plan)) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    // ── 安全校验：服务端独立计算金额，不信任客户端 ──
    const planConfig = PRICING_CONFIG[plan];
    let amount: number;
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
      const serverAmount = calculateProratedAmount(currentPlan, plan, activeSubscription.expireAt);
      amount = serverAmount;
      action = 'upgrade';

      // 安全日志：记录升级操作
      console.log(`[Stripe Security] User ${user.id} upgrade ${currentPlan}→${plan}, serverAmount=${serverAmount}, clientProvided=${clientAmount ?? 'N/A'}`);
    } else {
      // 新购：金额完全由服务端定价决定
      amount = planConfig.amount;

      // 安全校验：如果客户端传了金额且与服务端差异过大，记录告警
      if (clientAmount && Math.abs(clientAmount - amount) > 1) {
        console.warn(`[Stripe Security] ⚠️ 金额异常! User ${user.id} plan=${plan}, server=${amount}, clientSent=${clientAmount}, IP=${req.headers.get('x-forwarded-for') || 'unknown'}`);
        // 不阻止请求（因为最终以服务端为准），但记录异常用于监控
      }
    }

    // 金额合理性边界检查：不能低于最低价的一半（防止极端篡改）
    const minPlanPrice = Math.min(...Object.values(PRICING_CONFIG).map(c => c.amount));
    if (amount < minPlanPrice * 0.5 && action === 'purchase') {
      console.error(`[Stripe Security] 🔴 金额过低! User ${user.id} plan=${plan}, amount=${amount}, expected>=${minPlanPrice}`);
      return NextResponse.json({ error: '价格计算异常，请联系客服' }, { status: 400 });
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
        details: '请检查 Stripe 配置是否正确',
      },
      { status: 500 }
    );
  }
}

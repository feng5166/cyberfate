import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCheckoutSession, listCustomers, stripeRequest, type StripeCheckoutSession } from '@/lib/stripe-direct';
import { PRICING_CONFIG, isValidPlanId, isSellablePlanId, type PlanId } from '@/lib/pricing-config';
import { log } from '@/lib/logger';
import { getClientIp } from '@/lib/ip';

const PLAN_RANK: Record<PlanId, number> = {
  daily: 1,
  yearly: 2,
  lifetime: 3,
};

interface GuestCheckoutParams {
  customerEmail: string;
  priceData: {
    currency: string;
    unit_amount: number;
    product_data: { name: string; description?: string };
  };
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

/**
 * 真·首购（DB 无 stripeCustomerId 且 Stripe 侧按 email 也查不到）专用：
 * 以 customer_email 直建 checkout session。
 * 字段与 stripe-direct.createCheckoutSession 保持一致，额外带 customer_creation=always ——
 * payment 模式下 Stripe 默认（if_required）不建 Customer，不显式指定则 webhook 拿不到
 * session.customer 回填 stripeCustomerId，后续 portal（按 email 查 customer）也会 404。
 * stripe-direct.createCheckoutSession 暂不支持该参数，故基于其导出的 stripeRequest 组装；
 * 待其支持后可回收本函数。
 */
async function createGuestCheckoutSession(params: GuestCheckoutParams) {
  const body = new URLSearchParams();

  body.set('mode', 'payment');
  body.set('success_url', params.successUrl);
  body.set('cancel_url', params.cancelUrl);

  body.set('payment_method_types[0]', 'card');
  body.set('payment_method_options[card][request_three_d_secure]', 'automatic');
  body.set('billing_address_collection', 'auto');
  body.set('custom_text[submit][message]', 'CYBERFATE');

  body.set('line_items[0][price_data][currency]', params.priceData.currency);
  body.set('line_items[0][price_data][unit_amount]', String(params.priceData.unit_amount));
  body.set('line_items[0][price_data][product_data][name]', params.priceData.product_data.name);
  if (params.priceData.product_data.description) {
    body.set('line_items[0][price_data][product_data][description]', params.priceData.product_data.description);
  }
  body.set('line_items[0][quantity]', '1');

  body.set('customer_email', params.customerEmail);
  body.set('customer_creation', 'always');

  for (const [k, v] of Object.entries(params.metadata)) {
    body.set(`metadata[${k}]`, v);
  }

  return stripeRequest<StripeCheckoutSession>('/checkout/sessions', {
    method: 'POST',
    body: body.toString(),
  });
}

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

    // 性能：先解析并校验 body，无效套餐直接拒绝，不白耗 DB 往返
    const { plan, clientAmount } = await req.json();

    if (!isValidPlanId(plan)) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    // 已下架套餐(祖父条款)不可再购买
    if (!isSellablePlanId(plan)) {
      return NextResponse.json({ error: '该套餐已下架' }, { status: 400 });
    }

    // 性能：user 与有效订阅合成一次 include 查询（原先两次串行 PG 往返）
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'active', expireAt: { gt: new Date() } },
          orderBy: { expireAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const activeSubscription = user.subscriptions[0] ?? null;

    // ── 安全校验：服务端独立计算金额，不信任客户端 ──
    const planConfig = PRICING_CONFIG[plan];
    let amount: number;
    let action: 'purchase' | 'upgrade' = 'purchase';

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
      log({ service: 'stripe', level: 'info', message: 'upgrade security check', meta: { userId: user.id, currentPlan, targetPlan: plan, serverAmount, clientAmount: clientAmount ?? 'N/A' } });
    } else {
      // 新购：金额完全由服务端定价决定
      amount = planConfig.amount;

      // 安全校验：如果客户端传了金额且与服务端差异过大，记录告警
      if (clientAmount && Math.abs(clientAmount - amount) > 1) {
        console.warn(`[Stripe Security] ⚠️ 金额异常! User ${user.id} plan=${plan}, server=${amount}, clientSent=${clientAmount}, IP=${getClientIp(req)}`);
        // 不阻止请求（因为最终以服务端为准），但记录异常用于监控
      }
    }

    // 金额合理性边界检查：不能低于最低价的一半（防止极端篡改）
    const minPlanPrice = Math.min(...Object.values(PRICING_CONFIG).map(c => c.amount));
    if (amount < minPlanPrice * 0.5 && action === 'purchase') {
      console.error(`[Stripe Security] 🔴 金额过低! User ${user.id} plan=${plan}, amount=${amount}, expected>=${minPlanPrice}`);
      return NextResponse.json({ error: '价格计算异常，请联系客服' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const description = action === 'upgrade'
      ? `从当前套餐升级到${planConfig.name}（补差价）`
      : `${planConfig.name} ${planConfig.period}付套餐`;

    const checkoutParams = {
      priceData: {
        currency: planConfig.currency,
        unit_amount: amount,
        product_data: {
          name: `${planConfig.name} - ${planConfig.period}付`,
          description,
        },
      },
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
    };

    // M6: 优先复用 DB 持久化的 stripeCustomerId，避免 listByEmail 选错 customer。
    // 性能：首购省掉 createCustomer + user.update 两步（Stripe 调用 3→2）——
    // 但 listCustomers 兜底必须保留：DB 列为空不等于 Stripe 侧没有 Customer
    //（历史用户、或之前从别的入口付过款），少了这一步会给同一用户重复建号，
    // 账单门户按 email 只认得到其中一个，历史付款记录随之「丢失」。
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customersRes = await listCustomers(user.email!);
      if (!customersRes.ok) {
        return NextResponse.json(
          { error: '查询客户失败', details: customersRes.error },
          { status: 500 }
        );
      }
      customerId = customersRes.data!.data[0]?.id ?? null;
    }

    let checkoutRes: Awaited<ReturnType<typeof createCheckoutSession>>;

    if (customerId) {
      // Stripe 侧已有 Customer：走 customerId 分支复用。DB 列为空时顺手回写，
      // 但与 createCheckoutSession 并行发出，不给支付链路多加一次串行 PG 往返；
      // 回写失败只告警（stripeCustomerId 有唯一约束，极端情况可能 P2002），
      // 不影响本次支付——下次进来 listCustomers 还能查到同一个 Customer。
      const backfill: Promise<unknown> = user.stripeCustomerId
        ? Promise.resolve()
        : prisma.user
            .update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
            .catch((err: unknown) => {
              log({ service: 'stripe', level: 'warn', message: 'stripeCustomerId backfill failed', meta: { userId: user.id, customerId, error: err instanceof Error ? err.message : String(err) } });
            });

      [checkoutRes] = await Promise.all([
        createCheckoutSession({
          mode: 'payment',
          customerId,
          quantity: 1,
          ...checkoutParams,
        }),
        backfill,
      ]);
    } else {
      // Stripe 侧确实没有该 email 的 Customer：不预建，交给 checkout 的
      // customer_creation=always 生成，stripeCustomerId 由 webhook 从
      // session.customer 回填（省下 createCustomer + user.update 两步）。
      checkoutRes = await createGuestCheckoutSession({
        customerEmail: user.email!,
        ...checkoutParams,
      });
    }

    if (!checkoutRes.ok) {
      return NextResponse.json(
        { error: '创建支付会话失败', details: checkoutRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkout_url: checkoutRes.data!.url });
  } catch (error: unknown) {
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

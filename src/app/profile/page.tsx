import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { FREE_BAZI_AI_LIMIT, getSubscription, getBaziUsage } from '@/lib/subscription'
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const email = session.user.email ?? ''

  // 原来 checkQuota 内部还会再查一次 subscription（isVip），与 getSubscription 完全重复；
  // 改成只取用量，VIP 直接由已查到的 subscription 判定 —— 三次查询降为两次并行
  const [subscription, usage] = await Promise.all([
    getSubscription(session.user.id),
    getBaziUsage(session.user.id),
  ])

  const vip = subscription !== null

  const subscriptionDetail = subscription ? (() => {
    const planId = subscription.plan as PlanId;
    const config = PRICING_CONFIG[planId];
    return {
      plan: subscription.plan,
      plan_name: config ? `${config.name}（${config.period}卡）` : subscription.plan,
      price: config ? config.amount / 100 : 0,
      current_period_start: subscription.startAt.toISOString(),
      current_period_end: subscription.expireAt.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd || false,
      pending_plan: subscription.pendingPlan || null,
      payment_method: subscription.paymentMethod ? {
        type: subscription.paymentMethod,
        last4: subscription.paymentMethodLast4 || '****'
      } : null
    };
  })() : null;

  return (
    <Suspense fallback={null}>
      <ProfileClient
        email={email}
        image={session.user.image ?? null}
        vip={vip}
        subscriptionPlan={subscription?.plan ?? null}
        subscriptionDetail={subscriptionDetail}
        expireAt={subscription?.expireAt?.toISOString().slice(0, 10) ?? null}
        baziAiCount={usage.baziAiCount}
        limit={vip ? null : FREE_BAZI_AI_LIMIT}
        subscriptionStart={subscription?.startAt?.toISOString() ?? null}
      />
    </Suspense>
  )
}

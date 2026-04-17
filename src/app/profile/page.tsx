import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getSubscription, checkQuota } from '@/lib/subscription'
import { listCustomers } from '@/lib/stripe-direct'
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const email = session.user.email ?? ''

  const [subscription, quota, stripeCustomers] = await Promise.all([
    getSubscription(session.user.id),
    checkQuota(session.user.id),
    email ? listCustomers(email).catch(() => null) : null,
  ])

  const stripeCustomerId = stripeCustomers?.ok && stripeCustomers.data?.data?.[0]?.id
    ? stripeCustomers.data.data[0].id
    : null

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
    <ProfileClient
      email={email}
      image={session.user.image ?? null}
      vip={vip}
      subscriptionPlan={subscription?.plan ?? null}
      subscriptionDetail={subscriptionDetail}
      expireAt={subscription?.expireAt?.toISOString().slice(0, 10) ?? null}
      baziAiCount={quota.baziAiCount}
      limit={vip ? null : quota.limit}
      stripeCustomerId={stripeCustomerId}
      subscriptionStart={subscription?.startAt?.toISOString() ?? null}
    />
  )
}

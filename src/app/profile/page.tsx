import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getSubscription, checkQuota } from '@/lib/subscription'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const [subscription, quota] = await Promise.all([
    getSubscription(session.user.id),
    checkQuota(session.user.id),
  ])

  const vip = subscription !== null

  // 映射 subscription 详情
  const planNames = {
    monthly: '基础版（月卡）',
    quarterly: '专业版（季卡）',
    yearly: '尊享版（年卡）'
  };

  const prices = {
    monthly: 29,
    quarterly: 68,
    yearly: 238
  };

  const subscriptionDetail = subscription ? {
    plan: subscription.plan,
    plan_name: planNames[subscription.plan],
    price: prices[subscription.plan],
    current_period_end: subscription.expireAt.toISOString()
  } : null;

  return (
    <ProfileClient
      email={session.user.email ?? ''}
      image={session.user.image ?? null}
      vip={vip}
      subscriptionPlan={subscription?.plan ?? null}
      subscriptionDetail={subscriptionDetail}
      expireAt={subscription?.expireAt?.toISOString().slice(0, 10) ?? null}
      baziAiCount={quota.baziAiCount}
      limit={vip ? null : quota.limit}
    />
  )
}

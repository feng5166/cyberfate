import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getSubscription, checkQuota } from '@/lib/subscription'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const [subscription, quota] = await Promise.all([
    getSubscription(session.user.id),
    checkQuota(session.user.id),
  ])

  const vip = subscription !== null

  return (
    <ProfileClient
      email={session.user.email ?? ''}
      vip={vip}
      expireAt={subscription?.expireAt?.toISOString().slice(0, 10) ?? null}
      baziAiCount={quota.baziAiCount}
      limit={vip ? null : quota.limit}
    />
  )
}

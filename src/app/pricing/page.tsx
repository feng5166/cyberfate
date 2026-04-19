import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription'
import { getPlanName } from '@/lib/pricing-config'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: '会员定价',
  description: '选择适合的会员方案，解锁AI命理分析、八字排盘、塔罗占卜等全部高级功能',
  keywords: ['会员定价', '命理会员', '订阅方案', 'AI命理'],
  openGraph: {
    title: '会员定价',
    description: '选择适合的会员方案，解锁AI命理分析、八字排盘、塔罗占卜等全部高级功能',
    type: 'website',
  },
}

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  let currentPlan: string | undefined

  if (session?.user) {
    const subscription = await getSubscription(session.user.id)
    if (subscription?.plan) {
      currentPlan = getPlanName(subscription.plan)
    }
  }

  return (
    <Suspense>
      <PricingClient currentPlan={currentPlan} />
    </Suspense>
  )
}

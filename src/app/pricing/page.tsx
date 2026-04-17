import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription'
import PricingClient from './PricingClient'

const planNameMap: Record<string, string> = {
  daily: '基础版',
  yearly: '专业版',
  yearly: '尊享版',
}

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  let currentPlan: string | undefined

  if (session?.user) {
    const subscription = await getSubscription(session.user.id)
    if (subscription?.plan) {
      currentPlan = planNameMap[subscription.plan]
    }
  }

  return (
    <Suspense>
      <PricingClient currentPlan={currentPlan} />
    </Suspense>
  )
}

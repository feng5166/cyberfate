import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription'
import { getPlanName } from '@/lib/pricing-config'
import PricingClient from './PricingClient'

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

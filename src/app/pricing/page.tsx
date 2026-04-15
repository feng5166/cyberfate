import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription'
import PricingClient from './PricingClient'

const planNameMap: Record<string, string> = {
  monthly: '基础版',
  quarterly: '专业版',
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

  return <PricingClient currentPlan={currentPlan} />
}

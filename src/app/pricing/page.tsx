import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: '会员定价 | 赛博命理师 CyberFate — 解锁全部 AI 命理功能',
  description: '赛博命理师 CyberFate 会员方案，解锁八字深度分析、紫微斗数命盘、六爻占卜、塔罗解读等全部 AI 命理功能。支持月付与年付，随时可取消。',
  keywords: ['命理会员', 'AI命理订阅', 'CyberFate会员', '八字分析会员', '命理定价'],
  alternates: { canonical: 'https://www.cyberfate.me/pricing' },
  openGraph: { title: '会员定价 | CyberFate', description: '解锁全部 AI 命理功能，月付年付随心选。', type: 'website', url: 'https://www.cyberfate.me/pricing' },
}

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  let currentPlan: string | undefined

  if (session?.user) {
    const subscription = await getSubscription(session.user.id)
    if (subscription?.plan) {
      currentPlan = subscription.plan // plan id（与卡片 plan.id 比对）
    }
  }

  return (
    <Suspense>
      <PricingClient currentPlan={currentPlan} />
    </Suspense>
  )
}

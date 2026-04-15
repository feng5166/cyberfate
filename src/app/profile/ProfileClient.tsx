'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SubscriptionCard } from '@/components/profile/SubscriptionCard'
import { SubscriptionManagePanel } from '@/components/profile/SubscriptionManagePanel'

interface ProfileClientProps {
  email: string
  image: string | null
  vip: boolean
  subscriptionPlan: 'monthly' | 'quarterly' | 'yearly' | null
  subscriptionDetail: {
    plan: string
    plan_name: string
    price: number
    current_period_end: string
    cancel_at_period_end: boolean
    pending_plan: string | null
  } | null
  expireAt: string | null
  baziAiCount: number
  limit: number | null
}

const planNameMap: Record<string, string> = {
  monthly: '基础版（月卡）',
  quarterly: '专业版（季卡）',
  yearly: '尊享版（年卡）',
}

export default function ProfileClient({
  email, image, vip, subscriptionPlan, subscriptionDetail, expireAt, baziAiCount, limit,
}: ProfileClientProps) {
  const router = useRouter()
  const [showManagePanel, setShowManagePanel] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background-alt py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {!showManagePanel ? (
          <>
            {/* 头像和标题 */}
            <div className="text-center">
              {image ? (
                <img src={image} alt="头像" className="w-20 h-20 mx-auto rounded-full border-2 border-border object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-background border-2 border-border flex items-center justify-center text-3xl font-bold text-primary">
                  {email.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="font-heading text-2xl font-bold text-primary mt-3">个人中心</h1>
              {vip && subscriptionPlan && (
                <p className="text-muted text-sm mt-1">
                  ✅ {planNameMap[subscriptionPlan] ?? 'VIP 会员'} · 有效期至 {expireAt}
                </p>
              )}
            </div>

            {/* 账号信息 */}
            <Card hover={false}>
              <h2 className="text-secondary text-sm mb-4 uppercase tracking-wider">账号信息</h2>
              <div>
                <p className="text-primary">{email}</p>
                <p className="text-muted text-xs mt-0.5">邮箱账号</p>
              </div>
            </Card>

            {/* 订阅管理卡片 */}
            <div onClick={() => vip && setShowManagePanel(true)}>
              <SubscriptionCard
                subscription={subscriptionDetail}
                isSubscribed={vip}
                quotaUsed={baziAiCount}
                quotaLimit={limit}
              />
            </div>

            {/* 退出登录 */}
            <Button variant="ghost" className="w-full" onClick={handleSignOut}>
              退出登录
            </Button>
          </>
        ) : (
          subscriptionDetail && (
            <SubscriptionManagePanel
              subscription={subscriptionDetail}
              onBack={() => {
                setShowManagePanel(false)
                router.refresh()
              }}
            />
          )
        )}
      </div>
    </div>
  )
}

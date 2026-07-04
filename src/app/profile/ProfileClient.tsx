'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SubscriptionManagePanel } from '@/components/profile/SubscriptionManagePanel'
import { getPlanName, getPlanPeriodLabel, isLifetimePlan } from '@/lib/pricing-config'

interface ProfileClientProps {
  email: string
  image: string | null
  vip: boolean
  subscriptionPlan: 'daily' | 'lifetime' | 'yearly' | null
  subscriptionDetail: {
    plan: string
    plan_name: string
    price: number
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    pending_plan: string | null
    payment_method: {
      type: string
      last4: string
    } | null
  } | null
  expireAt: string | null
  baziAiCount: number
  limit: number | null
  subscriptionStart: string | null
}


export default function ProfileClient({
  email, image, vip, subscriptionPlan, subscriptionDetail, expireAt, baziAiCount, limit,
  subscriptionStart,
}: ProfileClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showManagePanel, setShowManagePanel] = useState(false)

  useEffect(() => {
    if (searchParams.get('manage') === 'true' && vip && subscriptionDetail) {
      setShowManagePanel(true)
    }
  }, [searchParams, vip, subscriptionDetail])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const emailPrefix = email.split('@')[0]
  const avatarLetter = email.charAt(0).toUpperCase()

  if (showManagePanel && subscriptionDetail) {
    return (
      <div className="min-h-dvh bg-brand-bg">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <SubscriptionManagePanel
            subscription={subscriptionDetail}
            onBack={() => {
              setShowManagePanel(false)
              router.replace('/profile')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* 顶部标题 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-brand-gray hover:text-brand-ink transition-colors mb-4 inline-flex items-center gap-1 text-sm"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-brand-ink">账户信息</h1>
        </div>

        {/* 个人信息区块 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-brand-gray uppercase tracking-wider mb-4">个人信息</h2>
          <div className="flex items-start gap-5">
            {/* 头像 */}
            {image ? (
              <img
                src={image}
                alt="头像"
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-ink text-white flex items-center justify-center text-xl font-semibold flex-shrink-0">
                {avatarLetter}
              </div>
            )}

            {/* 信息网格 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1 min-w-0">
              <div>
                <p className="text-xs text-brand-light mb-0.5">姓名</p>
                <p className="text-sm font-medium text-brand-ink truncate">{emailPrefix}</p>
              </div>
              <div>
                <p className="text-xs text-brand-light mb-0.5">邮箱</p>
                <p className="text-sm font-medium text-brand-ink truncate">{email}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 分隔线 */}
        <hr className="border-brand-border-light mb-8" />

        {/* 订阅信息区块 */}
        {vip && subscriptionDetail ? (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-brand-gray uppercase tracking-wider">订阅信息</h2>
              <p className="text-xs text-brand-light mt-0.5">管理您的订阅计划</p>
            </div>

            <div className="bg-white border border-brand-border-light rounded-card shadow-card p-5">
              {/* 套餐名称 + 价格 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-brand-ink">
                    {subscriptionDetail.plan_name}
                  </span>
                  {!subscriptionDetail.cancel_at_period_end && (
                    <span className="text-[11px] font-semibold bg-brand-accent text-white px-2 py-0.5 rounded">
                      激活
                    </span>
                  )}
                  {subscriptionDetail.cancel_at_period_end && (
                    <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      到期取消
                    </span>
                  )}
                </div>
                <span className="text-base font-semibold text-brand-ink">
                  ${subscriptionDetail.price}
                  <span className="text-sm font-normal text-brand-light">
                    /{getPlanPeriodLabel(subscriptionDetail.plan) || '天'}
                  </span>
                </span>
              </div>

              {/* 当前周期 */}
              <p className="text-sm text-brand-gray mb-4">
                  {isLifetimePlan(subscriptionDetail.plan)
                  ? '🎉 终身有效，无需续费'
                  : `当前周期：${formatDate(subscriptionDetail.current_period_start)} - ${formatDate(subscriptionDetail.current_period_end)}`}
              </p>

              {subscriptionDetail.pending_plan && (
                <p className="text-sm text-brand-accent mb-4">
                  ⏳ 下一周期将切换为{getPlanName(subscriptionDetail.pending_plan)}
                </p>
              )}

              {/* 管理订阅按钮 */}
              <button
                onClick={() => setShowManagePanel(true)}
                className="w-full min-h-[44px] py-2.5 text-sm font-medium text-brand-ink bg-white border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
              >
                管理订阅
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="bg-white border border-brand-border-light rounded-card shadow-card p-5 text-center">
              <p className="text-brand-gray text-sm mb-1">当前为免费用户</p>
              <p className="text-brand-light text-xs mb-4">
                已使用 {baziAiCount}/{limit ?? '∞'} 次 AI 解读
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 min-h-[44px] py-2.5 text-sm font-medium text-white bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors"
              >
                升级 VIP
              </button>
            </div>
          </section>
        )}

        {/* 退出登录 */}
        <button
          onClick={handleSignOut}
          className="w-full min-h-[44px] py-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

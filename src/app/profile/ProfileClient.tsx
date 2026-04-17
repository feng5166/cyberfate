'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SubscriptionManagePanel } from '@/components/profile/SubscriptionManagePanel'

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
  stripeCustomerId: string | null
  subscriptionStart: string | null
}

const periodMap: Record<string, string> = {
  daily: '天',
  yearly: '年',
  lifetime: '终身',
}

export default function ProfileClient({
  email, image, vip, subscriptionPlan, subscriptionDetail, expireAt, baziAiCount, limit,
  stripeCustomerId, subscriptionStart,
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <SubscriptionManagePanel
            subscription={subscriptionDetail}
            onBack={() => {
              setShowManagePanel(false)
              router.refresh()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* 顶部标题 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-900 transition-colors mb-4 inline-flex items-center gap-1 text-sm"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">账户信息</h1>
        </div>

        {/* 个人信息区块 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">个人信息</h2>
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
              <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold flex-shrink-0">
                {avatarLetter}
              </div>
            )}

            {/* 信息网格 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1 min-w-0">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">姓名</p>
                <p className="text-sm font-medium text-gray-900 truncate">{emailPrefix}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">邮箱</p>
                <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">STRIPE 客户 ID</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {stripeCustomerId || '无'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 分隔线 */}
        <hr className="border-gray-200 mb-8" />

        {/* 订阅信息区块 */}
        {vip && subscriptionDetail ? (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">订阅信息</h2>
              <p className="text-xs text-gray-400 mt-0.5">管理您的订阅计划</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              {/* 套餐名称 + 价格 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">
                    {subscriptionDetail.plan_name}
                  </span>
                  {!subscriptionDetail.cancel_at_period_end && (
                    <span className="text-[11px] font-medium bg-gray-900 text-white px-2 py-0.5 rounded">
                      激活
                    </span>
                  )}
                  {subscriptionDetail.cancel_at_period_end && (
                    <span className="text-[11px] font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                      到期取消
                    </span>
                  )}
                </div>
                <span className="text-base font-semibold text-gray-900">
                  ¥{subscriptionDetail.price}
                  <span className="text-sm font-normal text-gray-400">
                    /{periodMap[subscriptionDetail.plan] || '月'}
                  </span>
                </span>
              </div>

              {/* 当前周期 */}
              <p className="text-sm text-gray-500 mb-4">
                当前周期：{formatDate(subscriptionDetail.current_period_start)} - {formatDate(subscriptionDetail.current_period_end)}
              </p>

              {subscriptionDetail.pending_plan && (
                <p className="text-sm text-blue-600 mb-4">
                  ⏳ 下一周期将切换为{subscriptionDetail.pending_plan === 'daily' ? '基础版' : subscriptionDetail.pending_plan === 'yearly' ? '专业版' : '尊享版'}
                </p>
              )}

              {/* 管理订阅按钮 */}
              <button
                onClick={() => setShowManagePanel(true)}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                管理订阅
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 text-center">
              <p className="text-gray-500 text-sm mb-1">当前为免费用户</p>
              <p className="text-gray-400 text-xs mb-4">
                已使用 {baziAiCount}/{limit ?? '∞'} 次 AI 解读
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                升级 VIP
              </button>
            </div>
          </section>
        )}

        {/* 退出登录 */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

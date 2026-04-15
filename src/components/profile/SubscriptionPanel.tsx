'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { PlanChangeSection } from './PlanChangeSection'
import { CancelSection } from './CancelSection'
import { PaymentMethodSection } from './PaymentMethodSection'
import { BillingHistory } from './BillingHistory'
import { PLAN_CONFIG, type SubscriptionData } from './types'

interface SubscriptionPanelProps {
  onBack: () => void
  onSubscriptionChanged: () => void
}

export function SubscriptionPanel({ onBack, onSubscriptionChanged }: SubscriptionPanelProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription/current')
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleChange = () => {
    fetchSubscription()
    onSubscriptionChanged()
  }

  const handleCancelPendingDowngrade = async () => {
    try {
      const res = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel: true }),
      })
      if (res.ok) handleChange()
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <Card hover={false}>
        <div className="text-center py-10 text-sm text-[#1C1A16]/40">加载中...</div>
      </Card>
    )
  }

  if (!subscription || subscription.status === 'none') {
    return (
      <Card hover={false}>
        <button onClick={onBack} className="text-sm text-[#1C1A16]/50 hover:text-[#1C1A16] mb-4 transition-colors">
          ← 返回
        </button>
        <div className="text-center py-8 text-sm text-[#1C1A16]/50">
          暂无有效订阅
        </div>
      </Card>
    )
  }

  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start).toLocaleDateString('zh-CN')
    : '—'
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('zh-CN')
    : '—'

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <button onClick={onBack} className="text-sm text-[#1C1A16]/50 hover:text-[#1C1A16] mb-4 transition-colors">
          ← 返回
        </button>

        <h2 className="text-lg font-bold text-[#1C1A16] mb-5">管理订阅</h2>

        {/* 当前计划概览 */}
        <div className="p-4 rounded-xl border border-[#E5E2DD] bg-[#FAF9F6] mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#1C1A16]">📋 当前计划</span>
            <span className="text-xs bg-[#1C1A16] text-white px-2 py-0.5 rounded-full">
              {subscription.cancel_at_period_end ? '⚠️ 已取消续订' : '✅ 当前计划'}
            </span>
          </div>
          <p className="text-[#1C1A16] font-bold text-lg">{subscription.plan_name}</p>
          <p className="text-[#1C1A16]/60 text-sm">¥{subscription.price}{PLAN_CONFIG[subscription.plan ?? '']?.period ?? ''}</p>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-[#1C1A16]/60">
            <div>
              <span className="block text-[#1C1A16]/40">开始日期</span>
              <span className="text-[#1C1A16]">{periodStart}</span>
            </div>
            <div>
              <span className="block text-[#1C1A16]/40">到期日期</span>
              <span className="text-[#1C1A16]">{periodEnd}</span>
            </div>
            <div>
              <span className="block text-[#1C1A16]/40">自动续订</span>
              <span className="text-[#1C1A16]">{subscription.cancel_at_period_end ? '已关闭' : '已开启'}</span>
            </div>
            <div>
              <span className="block text-[#1C1A16]/40">下次扣费</span>
              <span className="text-[#1C1A16]">{subscription.cancel_at_period_end ? '不续费' : periodEnd}</span>
            </div>
          </div>

          {subscription.pending_plan && (
            <div className="mt-3 flex items-center justify-between bg-amber-50 p-2 rounded-lg">
              <span className="text-xs text-amber-700">
                ⏳ 将于 {subscription.pending_plan_date ? new Date(subscription.pending_plan_date).toLocaleDateString('zh-CN') : periodEnd} 切换为
                {PLAN_CONFIG[subscription.pending_plan]?.name ?? subscription.pending_plan}
              </span>
              <button
                onClick={handleCancelPendingDowngrade}
                className="text-xs text-amber-700 underline hover:text-amber-900"
              >
                撤销
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!subscription.cancel_at_period_end && (
            <PlanChangeSection subscription={subscription} onPlanChanged={handleChange} />
          )}

          <div className="border-t border-[#E5E2DD]" />
          <PaymentMethodSection subscription={subscription} />

          <div className="border-t border-[#E5E2DD]" />
          <CancelSection subscription={subscription} onCancelled={handleChange} />

          <div className="border-t border-[#E5E2DD]" />
          <BillingHistory />
        </div>
      </Card>
    </div>
  )
}

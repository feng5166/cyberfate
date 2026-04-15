'use client'

import { useState } from 'react'
import { PLAN_CONFIG, type SubscriptionData } from './types'
import { UpgradeModal } from './UpgradeModal'
import { DowngradeModal } from './DowngradeModal'

interface PlanChangeSectionProps {
  subscription: SubscriptionData
  onPlanChanged: () => void
}

export function PlanChangeSection({ subscription, onPlanChanged }: PlanChangeSectionProps) {
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null)
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null)

  const currentRank = PLAN_CONFIG[subscription.plan ?? '']?.rank ?? 0
  const plans = Object.entries(PLAN_CONFIG)

  const now = new Date()
  const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : now
  const remainingDays = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const currentDuration = PLAN_CONFIG[subscription.plan ?? '']?.duration ?? 30
  const currentPrice = PLAN_CONFIG[subscription.plan ?? '']?.price ?? 0

  const calcUpgradeProration = (targetPlan: string): number => {
    const targetPrice = PLAN_CONFIG[targetPlan]?.price ?? 0
    const remainingValue = currentPrice * (remainingDays / currentDuration)
    return Math.max(0, Math.round((targetPrice - remainingValue) * 100) / 100)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1C1A16] mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#1C1A16] rounded-full inline-block" />
        变更套餐
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {plans.map(([key, config]) => {
          const isCurrent = key === subscription.plan
          const isHigher = config.rank > currentRank
          const isLower = config.rank < currentRank
          const isPending = subscription.pending_plan === key

          return (
            <div
              key={key}
              className={`relative rounded-xl border p-4 text-center transition-all ${
                isCurrent
                  ? 'border-[#1C1A16] bg-[#1C1A16]/[0.03] ring-1 ring-[#1C1A16]'
                  : 'border-[#E5E2DD] hover:border-[#1C1A16]/30'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-[#1C1A16] text-white px-2 py-0.5 rounded-full">
                  ★ 当前
                </span>
              )}
              {isPending && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  ⏳ 待切换
                </span>
              )}
              <p className="font-semibold text-[#1C1A16] text-sm">{config.name}</p>
              <p className="text-[#1C1A16] text-xl font-bold mt-1">¥{config.price}</p>
              <p className="text-[#1C1A16]/50 text-xs">{config.period}</p>

              {isCurrent ? (
                <p className="mt-3 text-xs text-[#1C1A16]/40">当前计划</p>
              ) : isHigher ? (
                <button
                  onClick={() => setUpgradeTarget(key)}
                  className="mt-3 w-full text-xs font-medium py-1.5 rounded-lg bg-[#1C1A16] text-white hover:bg-[#2C2924] transition-colors"
                >
                  升级 →
                </button>
              ) : isLower ? (
                <button
                  onClick={() => setDowngradeTarget(key)}
                  disabled={!!subscription.pending_plan}
                  className="mt-3 w-full text-xs font-medium py-1.5 rounded-lg border border-[#1C1A16]/20 text-[#1C1A16] hover:bg-[#1C1A16]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  切换 ↓
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {upgradeTarget && (
        <UpgradeModal
          currentPlan={subscription.plan ?? ''}
          targetPlan={upgradeTarget}
          proratedAmount={calcUpgradeProration(upgradeTarget)}
          periodEnd={subscription.current_period_end ?? ''}
          onClose={() => setUpgradeTarget(null)}
          onConfirm={async () => {
            const res = await fetch('/api/subscription/upgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ new_plan: upgradeTarget }),
            })
            if (res.ok) {
              setUpgradeTarget(null)
              onPlanChanged()
            }
            return res.ok
          }}
        />
      )}

      {downgradeTarget && (
        <DowngradeModal
          currentPlan={subscription.plan ?? ''}
          targetPlan={downgradeTarget}
          effectiveDate={subscription.current_period_end ?? ''}
          onClose={() => setDowngradeTarget(null)}
          onConfirm={async () => {
            const res = await fetch('/api/subscription/downgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ new_plan: downgradeTarget }),
            })
            if (res.ok) {
              setDowngradeTarget(null)
              onPlanChanged()
            }
            return res.ok
          }}
        />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { PLAN_CONFIG } from './types'

interface UpgradeModalProps {
  currentPlan: string
  targetPlan: string
  proratedAmount: number
  periodEnd: string
  onClose: () => void
  onConfirm: () => Promise<boolean>
}

export function UpgradeModal({ currentPlan, targetPlan, proratedAmount, periodEnd, onClose, onConfirm }: UpgradeModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentConfig = PLAN_CONFIG[currentPlan]
  const targetConfig = PLAN_CONFIG[targetPlan]

  const today = new Date().toLocaleDateString('zh-CN')
  const targetDuration = targetConfig?.duration ?? 30
  const newEnd = new Date(Date.now() + targetDuration * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')

  const handleConfirm = async () => {
    if (!agreed) return
    setLoading(true)
    setError('')
    try {
      const ok = await onConfirm()
      if (!ok) setError('升级失败，请重试')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1C1A16] mb-4">确认升级</h3>

        <div className="space-y-3 text-sm text-[#1C1A16]/70">
          <p>
            从 <span className="font-semibold text-[#1C1A16]">{currentConfig?.name}（{currentPlan === 'monthly' ? '月卡' : currentPlan === 'quarterly' ? '季卡' : '年卡'}）</span>
          </p>
          <p>
            升级到 <span className="font-semibold text-[#1C1A16]">{targetConfig?.name}（{targetPlan === 'monthly' ? '月卡' : targetPlan === 'quarterly' ? '季卡' : '年卡'}）</span>
          </p>
        </div>

        <div className="mt-4 p-3 bg-[#FAF9F6] rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#1C1A16]/60">需补差价</span>
            <span className="font-bold text-[#1C1A16] text-base">¥{proratedAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1C1A16]/60">新周期</span>
            <span className="text-[#1C1A16]">{today} ~ {newEnd}</span>
          </div>
        </div>

        <label className="flex items-start gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded border-[#1C1A16]/30 text-[#1C1A16] focus:ring-[#1C1A16]"
          />
          <span className="text-xs text-[#1C1A16]/60">我理解升级后将立即生效并扣费</span>
        </label>

        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#1C1A16]/15 text-sm text-[#1C1A16] hover:bg-[#FAF9F6] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className="flex-1 py-2.5 rounded-lg bg-[#1C1A16] text-white text-sm font-medium hover:bg-[#2C2924] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : `确认并支付 ¥${proratedAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

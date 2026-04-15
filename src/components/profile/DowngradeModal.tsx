'use client'

import { useState } from 'react'
import { PLAN_CONFIG } from './types'

interface DowngradeModalProps {
  currentPlan: string
  targetPlan: string
  effectiveDate: string
  onClose: () => void
  onConfirm: () => Promise<boolean>
}

export function DowngradeModal({ currentPlan, targetPlan, effectiveDate, onClose, onConfirm }: DowngradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentConfig = PLAN_CONFIG[currentPlan]
  const targetConfig = PLAN_CONFIG[targetPlan]
  const formattedDate = effectiveDate ? new Date(effectiveDate).toLocaleDateString('zh-CN') : '—'

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const ok = await onConfirm()
      if (!ok) setError('操作失败，请重试')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1C1A16] mb-4">确认切换套餐</h3>

        <div className="space-y-3 text-sm text-[#1C1A16]/70">
          <p>
            从 <span className="font-semibold text-[#1C1A16]">{currentConfig?.name}（{currentPlan === 'monthly' ? '月卡' : currentPlan === 'quarterly' ? '季卡' : '年卡'}）</span>
          </p>
          <p>
            切换到 <span className="font-semibold text-[#1C1A16]">{targetConfig?.name}（{targetPlan === 'monthly' ? '月卡' : targetPlan === 'quarterly' ? '季卡' : '年卡'}）</span>
          </p>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-lg space-y-2 text-sm">
          <p className="text-amber-800">当前周期剩余时间仍享受{currentConfig?.name}权益</p>
          <p className="text-amber-800 font-medium">新套餐将于 {formattedDate} 生效</p>
        </div>

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
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[#1C1A16] text-white text-sm font-medium hover:bg-[#2C2924] transition-colors disabled:opacity-40"
          >
            {loading ? '处理中...' : '确认切换'}
          </button>
        </div>
      </div>
    </div>
  )
}

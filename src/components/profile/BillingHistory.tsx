'use client'

import { useState, useEffect } from 'react'
import type { Invoice } from './types'

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: '✓ 已支付', color: 'text-green-600' },
  pending: { label: '⏳ 待支付', color: 'text-amber-600' },
  failed: { label: '✗ 失败', color: 'text-red-600' },
  refunded: { label: '↩ 已退款', color: 'text-blue-600' },
}

export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/subscription/billing-history')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1C1A16] mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#1C1A16] rounded-full inline-block" />
        账单历史
      </h3>

      {loading ? (
        <div className="text-center py-6 text-sm text-[#1C1A16]/40">加载中...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-6 text-sm text-[#1C1A16]/40 border border-dashed border-[#E5E2DD] rounded-xl">
          暂无支付记录
        </div>
      ) : (
        <div className="divide-y divide-[#E5E2DD] border border-[#E5E2DD] rounded-xl overflow-hidden">
          {invoices.map((inv) => {
            const st = statusConfig[inv.status] ?? statusConfig.pending
            return (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#1C1A16]/50 shrink-0 text-xs">{inv.date}</span>
                  <span className="text-[#1C1A16] truncate">{inv.description}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium text-[#1C1A16]">¥{inv.amount.toFixed(2)}</span>
                  <span className={`text-xs ${st.color}`}>{st.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

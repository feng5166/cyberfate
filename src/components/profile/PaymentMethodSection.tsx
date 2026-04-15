'use client'

import type { SubscriptionData } from './types'

interface PaymentMethodSectionProps {
  subscription: SubscriptionData
}

const methodLabels: Record<string, { icon: string; label: string }> = {
  alipay: { icon: '💳', label: '支付宝' },
  wechat: { icon: '💳', label: '微信支付' },
  stripe: { icon: '💳', label: '银行卡 (Stripe)' },
}

export function PaymentMethodSection({ subscription }: PaymentMethodSectionProps) {
  const method = subscription.payment_method
  const info = method ? methodLabels[method.type] ?? { icon: '💳', label: method.type } : null

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1C1A16] mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#1C1A16] rounded-full inline-block" />
        支付方式
      </h3>

      {info ? (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#E5E2DD]">
          <div className="flex items-center gap-3">
            <span className="text-lg">{info.icon}</span>
            <div>
              <p className="text-sm font-medium text-[#1C1A16]">{info.label}</p>
              <p className="text-xs text-[#1C1A16]/50">**** {method?.last4 ?? '****'}</p>
            </div>
          </div>
          <button
            className="text-xs text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
            title="多渠道支付接入后开放"
            disabled
          >
            更改 →
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-[#E5E2DD] text-sm text-[#1C1A16]/50">
          暂无绑定支付方式
        </div>
      )}

      <p className="text-xs text-[#1C1A16]/30 mt-2">多渠道支付切换功能即将上线</p>
    </div>
  )
}

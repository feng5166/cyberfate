'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PaymentModalProps {
  planName: string
  price: string
  onClose: () => void
}

export function PaymentModal({ planName, price, onClose }: PaymentModalProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handlePayment = () => {
    if (!session) {
      router.push('/auth/login')
      return
    }
    alert('支付功能开发中，敬请期待')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border border-primary/30 rounded-2xl p-8 max-w-sm w-full shadow-glow">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-4xl mb-3">💎</div>
          <h3 className="font-heading text-xl font-bold text-primary mb-1">
            开通 {planName}
          </h3>
          <p className="text-muted text-sm mb-6">{price}</p>

          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-cyber-gold-dark to-cyber-gold text-cyber-bg font-semibold py-3 rounded-lg hover:shadow-glow transition-all duration-200"
          >
            立即支付
          </button>

          <p className="text-muted text-xs mt-4">
            支付功能开发中
          </p>
        </div>
      </div>
    </div>
  )
}

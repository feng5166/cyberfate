'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 简单延迟，确保 webhook 处理完成
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-text-secondary">处理中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-cyber flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-heading font-bold text-cyber-gold mb-4">
          支付成功！
        </h1>
        <p className="text-text-secondary mb-2">
          恭喜你成为 VIP 会员
        </p>
        <p className="text-text-muted text-sm mb-8">
          订单号：{orderId}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/bazi')}
            className="w-full"
          >
            开始探索命运
          </Button>
          <button
            onClick={() => router.push('/profile')}
            className="w-full text-text-muted hover:text-text-primary text-sm"
          >
            查看个人中心
          </button>
        </div>
      </div>
    </div>
  )
}

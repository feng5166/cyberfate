'use client'

import { Button } from './Button'
import { useRouter } from 'next/navigation'

interface VipContentMaskProps {
  children: React.ReactNode
  isVip: boolean
}

export function VipContentMask({ children, isVip }: VipContentMaskProps) {
  const router = useRouter()
  
  if (isVip) {
    return <>{children}</>
  }
  
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/40">
        <div className="text-center">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-cyber-gold font-semibold mb-3">VIP 专属内容</p>
          <Button onClick={() => router.push('/pricing')} size="sm">
            解锁完整建议
          </Button>
        </div>
      </div>
    </div>
  )
}

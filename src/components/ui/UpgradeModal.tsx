'use client'

import { Button } from './Button'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function UpgradeModal({ 
  isOpen, 
  onClose,
  title = '今日免费解读次数已用完',
  description = '升级 VIP，享受无限 AI 深度解读'
}: UpgradeModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-cyber-card border border-cyber-gold/20 rounded-xl p-6 max-w-md w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
        >
          ✕
        </button>
        
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-heading font-bold mb-2 text-cyber-gold">
            {title}
          </h3>
          <p className="text-text-secondary mb-6">
            {description}
          </p>
          
          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full mb-3"
          >
            ¥69/季 开通 VIP
          </Button>
          
          <button 
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text-primary"
          >
            或明天再来（免费用户每日 1 次）
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail)
      setError('')
      setSuccess(false)
      setLoading(false)
    }
  }, [isOpen, initialEmail])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const validateEmail = (value: string): string | undefined => {
    if (!value) return '请输入邮箱地址'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址'
    return undefined
  }

  const handleSubmit = async () => {
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    if (countdown > 0) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'RATE_LIMITED') {
          setCountdown(data.remaining || 60)
          setError(`请求过于频繁，请 ${data.remaining || 60} 秒后重试`)
        } else {
          setError(data.message || '发送失败，请稍后重试')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setCountdown(60)
      setLoading(false)
    } catch {
      setError('网络异常，请稍后重试')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-ink/50 p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-pwd-title"
        className="w-[480px] max-w-[90vw] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题行 */}
        <div className="flex justify-between items-center mb-2">
          <h2 id="forgot-pwd-title" className="text-xl font-semibold text-brand-ink">忘记密码</h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="flex h-11 w-11 items-center justify-center rounded-full text-brand-gray hover:bg-brand-border-light hover:text-brand-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 副标题 */}
        <p className="text-brand-gray text-sm leading-relaxed mb-6">
          请输入您的账号邮箱，我们将向您发送重置密码的链接。
        </p>

        {/* 邮箱输入 */}
        <label className="text-sm font-medium text-brand-ink mb-2 block">邮箱地址</label>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="example@example.com"
          className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-brand-border bg-white text-brand-ink placeholder:text-brand-gray text-base focus:outline-none focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

        {/* 提示 */}
        <p className="text-brand-gray text-xs mt-3 mb-6">我们将向此邮箱发送重置密码的链接</p>

        {/* 按钮区 */}
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-brand-border text-brand-ink text-sm font-medium hover:bg-brand-bg transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!email || !!error || loading || countdown > 0}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${
              success
                ? 'bg-green-600 text-white'
                : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
            }`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading
              ? '发送中...'
              : success
                ? '已发送'
                : countdown > 0
                  ? `重新发送 (${countdown}s)`
                  : '发送重置链接'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

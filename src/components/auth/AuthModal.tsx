'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { GoogleLoginButton } from './GoogleLoginButton'
import { EmailLoginForm } from './EmailLoginForm'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import { track } from '@/lib/analytics'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  callbackUrl?: string
  /** 触发登录的上下文说明（如「今日免费次数已用完」），用于降低游客理解成本 */
  reason?: { title: string; desc: string }
}

export function AuthModal({ isOpen, onClose, callbackUrl = '/bazi', reason }: AuthModalProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [visible, setVisible] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showForgotPwd, setShowForgotPwd] = useState(false)
  const [forgotPwdEmail, setForgotPwdEmail] = useState('')

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setVisible(false)
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) track('login_modal_open', { trigger: 'modal_open' })
  }, [isOpen])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      // 忘记密码弹层打开时，Esc 先关它，避免一次按键连带关掉登录弹窗
      if (e.key === 'Escape' && !showForgotPwd) handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, handleClose, showForgotPwd])

  const handleGoogle = async () => {
    if (!agreed) {
      setServerError('请先阅读并同意用户协议和隐私政策')
      return
    }
    setGoogleLoading(true)
    setServerError('')
    track('login', { method: 'google' })
    await signIn('google', { callbackUrl })
  }

  const handleEmailSubmit = async (email: string, password: string) => {
    setLoading(true)
    setServerError('')

    try {
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const checkData = await checkRes.json()

      if (checkData.exists) {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        })
        if (result?.error) {
          setServerError(result.error)
          setLoading(false)
        } else {
          track('login', { method: 'email' })
          handleClose()
          router.push(callbackUrl)
          router.refresh()
        }
      } else {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (regRes.ok) {
          const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
          })
          if (!result?.error) {
            track('sign_up', { method: 'email' })
            handleClose()
            router.push(callbackUrl)
            router.refresh()
          } else {
            setServerError('登录失败，请重试')
            setLoading(false)
          }
        } else {
          const data = await regRes.json()
          setServerError(data.error || '注册失败')
          setLoading(false)
        }
      }
    } catch {
      setServerError('网络异常，请稍后重试')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-brand-ink/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* 弹窗 */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={`relative w-full max-w-[420px] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-brand-bg rounded-2xl p-8 shadow-2xl transition-all duration-200 ease-out
          max-sm:w-[90%] max-sm:max-w-[360px] max-sm:p-6
          ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.95]'}
        `}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          aria-label="关闭"
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-gray hover:bg-brand-border-light hover:text-brand-ink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 上下文说明（如游客次数用完）：解释为何登录 + 各档权益，降低理解成本 */}
        {reason && (
          <div className="mb-5 rounded-xl bg-gradient-to-br from-stone-100 to-stone-100 border border-stone-300/70 px-4 py-3.5">
            <p className="text-sm font-semibold text-[#1C1A16]">✨ {reason.title}</p>
            <p className="text-xs text-[#1C1A16]/85 mt-1.5 leading-relaxed">{reason.desc}</p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-medium text-[#1C1A16] hover:text-[#1C1A16] transition-colors"
            >
              开通会员不限次解读 + AI 八字问答 →
            </a>
          </div>
        )}

        {/* 标题区 */}
        <div className="text-center mb-6">
          <h2 id="auth-modal-title" className="text-brand-ink text-2xl max-sm:text-xl font-semibold">
            登录 / 注册
          </h2>
          <p className="text-brand-gray text-sm text-center mt-2">
            {reason ? '登录后每天可继续免费解读，并保存命盘' : '登录或创建账号以继续使用'}
          </p>
        </div>

        {/* Google 登录 */}
        <div className="mb-6">
          <GoogleLoginButton onClick={handleGoogle} loading={googleLoading} />
        </div>

        {/* 分割线 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-brand-gray text-xs whitespace-nowrap">
            或使用邮箱登录
          </span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        {/* 邮箱密码表单 */}
        <EmailLoginForm
          onSubmit={handleEmailSubmit}
          loading={loading}
          serverError={serverError}
          agreed={agreed}
          setAgreed={setAgreed}
          onForgotPassword={(email) => {
            setForgotPwdEmail(email)
            setShowForgotPwd(true)
          }}
        />

        <ForgotPasswordModal
          isOpen={showForgotPwd}
          onClose={() => setShowForgotPwd(false)}
          initialEmail={forgotPwdEmail}
        />
      </div>
    </div>
  )
}

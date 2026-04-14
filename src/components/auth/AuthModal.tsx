'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { GoogleLoginButton } from './GoogleLoginButton'
import { EmailLoginForm } from './EmailLoginForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  callbackUrl?: string
}

export function AuthModal({ isOpen, onClose, callbackUrl = '/bazi' }: AuthModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [visible, setVisible] = useState(false)
  const [agreed, setAgreed] = useState(false)

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

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, handleClose])

  const handleGoogle = async () => {
    if (!agreed) {
      setServerError('请先阅读并同意用户协议和隐私政策')
      return
    }
    setGoogleLoading(true)
    setServerError('')
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
          setServerError('邮箱或密码错误')
          setLoading(false)
        } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 弹窗 */}
      <div
        className={`relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-8 shadow-2xl transition-all duration-200 ease-out
          max-sm:w-[90%] max-sm:max-w-[360px] max-sm:p-6
          ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.95]'}
        `}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#9B9590] hover:text-[#1C1A16] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题区 */}
        <div className="text-center mb-6">
          <h2 className="text-[#1C1A16] text-2xl max-sm:text-xl font-semibold">
            登录 / 注册
          </h2>
          <p className="text-[#9B9590] text-sm text-center mt-2">
            登录或创建账号以继续使用
          </p>
        </div>

        {/* Google 登录 */}
        <div className="mb-6">
          <GoogleLoginButton onClick={handleGoogle} loading={googleLoading} />
        </div>

        {/* 分割线 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#E5E2DD]" />
          <span className="text-[#9B9590] text-xs whitespace-nowrap">
            或使用邮箱登录
          </span>
          <div className="flex-1 h-px bg-[#E5E2DD]" />
        </div>

        {/* 邮箱密码表单 */}
        <EmailLoginForm
          onSubmit={handleEmailSubmit}
          loading={loading}
          serverError={serverError}
          agreed={agreed}
          setAgreed={setAgreed}
        />
      </div>
    </div>
  )
}

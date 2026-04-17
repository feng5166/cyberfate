'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface EmailLoginFormProps {
  onSubmit: (email: string, password: string) => void
  loading?: boolean
  serverError?: string
  agreed?: boolean
  setAgreed?: (v: boolean) => void
  onForgotPassword?: (email: string) => void
}

interface FormErrors {
  email?: string
  password?: string
  agreement?: string
}

export function EmailLoginForm({
  onSubmit,
  loading,
  serverError,
  agreed: agreedProp,
  setAgreed: setAgreedProp,
  onForgotPassword,
}: EmailLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedLocal, setAgreedLocal] = useState(false)
  const agreed = agreedProp ?? agreedLocal
  const setAgreed = setAgreedProp ?? setAgreedLocal
  const [errors, setErrors] = useState<FormErrors>({})
  const [agreementShake, setAgreementShake] = useState(false)

  const validateEmail = (value: string): string | undefined => {
    if (!value) return '请输入邮箱地址'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址'
    return undefined
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return '请输入密码'
    if (value.length < 8) return '密码至少8个字符'
    return undefined
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const agreementError = !agreed ? '请先阅读并同意用户协议和隐私政策' : undefined

    const newErrors: FormErrors = {}
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError
    if (agreementError) {
      newErrors.agreement = agreementError
      setAgreementShake(true)
      setTimeout(() => setAgreementShake(false), 500)
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      console.log('[EmailLoginForm] 表单校验失败:', newErrors)
      return
    }

    onSubmit(email, password)
  }

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword(email)
    }
  }

  const inputBaseClass =
    'w-full border rounded-lg px-4 py-3 text-sm placeholder:text-[#C4C0BA] focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16] transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 邮箱 */}
      <div>
        <label className="text-[#1C1A16] text-sm font-medium mb-2 block">
          邮箱
        </label>
        <input
          type="email"
          autoComplete="email"
          placeholder="example@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          className={`${inputBaseClass} ${
            errors.email
              ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500'
              : 'border-[#E5E2DD]'
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* 密码 */}
      <div>
        <label className="text-[#1C1A16] text-sm font-medium mb-2 block">
          密码
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="至少8个字符"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            className={`${inputBaseClass} pr-11 ${
              errors.password
                ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500'
                : 'border-[#E5E2DD]'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9590] hover:text-[#1C1A16] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs ${errors.password ? 'text-red-500' : 'text-[#C4C0BA]'}`}>
            {errors.password || '至少8个字符'}
          </p>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-[#1C1A16] text-xs hover:underline cursor-pointer"
          >
            忘记密码?
          </button>
        </div>
      </div>

      {/* 协议 */}
      <div className={`flex items-start gap-2 mt-5 ${agreementShake ? 'animate-shake' : ''}`}>
        <input
          type="checkbox"
          id="auth-agree"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked)
            if (errors.agreement) setErrors((prev) => ({ ...prev, agreement: undefined }))
          }}
          className={`mt-0.5 w-4 h-4 rounded border-[#D5D0CA] text-[#1C1A16] focus:ring-[#1C1A16]/10 ${
            errors.agreement ? 'border-red-500' : ''
          }`}
        />
        <label htmlFor="auth-agree" className="text-[#6B6560] text-xs leading-relaxed">
          我已阅读并同意{' '}
          <a
            href="/terms"
            target="_blank"
            className="text-[#1C1A16] underline hover:no-underline cursor-pointer"
          >
            用户协议
          </a>{' '}
          和{' '}
          <a
            href="/privacy"
            target="_blank"
            className="text-[#1C1A16] underline hover:no-underline cursor-pointer"
          >
            隐私政策
          </a>
        </label>
      </div>
      {errors.agreement && (
        <p className="text-red-500 text-xs -mt-2">{errors.agreement}</p>
      )}

      {/* 服务器错误 */}
      {serverError && (
        <p className="text-red-500 text-xs text-center">{serverError}</p>
      )}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1C1A16] text-white rounded-lg py-3.5 px-4 font-medium text-sm hover:bg-[#1C1A16]/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {loading ? '登录中...' : '登录 / 注册'}
      </button>
    </form>
  )
}

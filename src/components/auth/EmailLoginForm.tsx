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
    const agreementError = !agreed ? '请确认您已年满 18 岁并同意服务条款和隐私政策' : undefined

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
    'w-full min-h-[44px] border rounded-lg px-4 py-3 text-base text-brand-ink placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 邮箱 */}
      <div>
        <label className="text-brand-ink text-sm font-medium mb-2 block">
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
              : 'border-brand-border'
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* 密码 */}
      <div>
        <label className="text-brand-ink text-sm font-medium mb-2 block">
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
                : 'border-brand-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-brand-gray hover:text-brand-ink transition-colors"
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
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          {!errors.password && <span />}
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-brand-gray text-xs hover:text-brand-ink hover:underline cursor-pointer"
          >
            忘记密码?
          </button>
        </div>
      </div>

      {/* 协议 */}
      <label
        htmlFor="auth-agree"
        className={`flex items-start gap-2 mt-5 cursor-pointer select-none ${agreementShake ? 'animate-shake' : ''}`}
      >
        <input
          type="checkbox"
          id="auth-agree"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked)
            if (errors.agreement) setErrors((prev) => ({ ...prev, agreement: undefined }))
          }}
          className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-brand-border text-brand-accent focus:ring-brand-accent/25 ${
            errors.agreement ? 'border-red-500' : ''
          }`}
        />
        <span className="text-brand-gray text-xs leading-relaxed">
          我已年满 18 岁，并已阅读并同意{' '}
          <a
            href="/terms"
            target="_blank"
            className="text-brand-ink underline hover:no-underline cursor-pointer"
          >
            服务条款
          </a>{' '}
          和{' '}
          <a
            href="/privacy"
            target="_blank"
            className="text-brand-ink underline hover:no-underline cursor-pointer"
          >
            隐私政策
          </a>
        </span>
      </label>
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
        className="w-full min-h-[44px] bg-brand-accent text-white rounded-lg py-3.5 px-4 font-medium text-base hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {loading ? '登录中...' : '免费开始 / 登录'}
      </button>
    </form>
  )
}

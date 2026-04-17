'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

type PageState = 'loading' | 'form' | 'success' | 'error'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || token.length < 10) {
      setPageState('error')
      setErrorMessage('重置链接无效，缺少必要参数')
      return
    }

    setPageState('form')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = '请输入新密码'
    } else if (password.length < 8) {
      newErrors.password = '密码至少8个字符'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认新密码'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        const isTokenError = ['TOKEN_EXPIRED', 'TOKEN_USED', 'TOKEN_INVALID', 'INVALID_TOKEN'].includes(data.error)
        const isUserError = data.error === 'USER_NOT_FOUND'

        if (isTokenError || isUserError) {
          setPageState('error')
          setErrorMessage(data.message || '重置链接无效')
        } else if (data.error === 'INTERNAL_ERROR' || data.error === 'DATABASE_ERROR') {
          setErrors({ password: `服务器异常，请稍后重试 [${data.error}]` })
        } else {
          setErrors({ password: data.message || `重置失败 (${data.error || '未知错误'})` })
        }
        setLoading(false)
        return
      }

      setPageState('success')
      setTimeout(() => router.push('/'), 2000)
    } catch {
      setErrors({ password: '网络异常，请稍后重试' })
      setLoading(false)
    }
  }

  const inputBaseClass =
    'w-full border border-[#D5D0CA] rounded-xl px-4 py-3 text-sm text-[#1C1A16] placeholder:text-[#B8B4AE] focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 focus:border-[#1C1A16] transition-colors pr-11'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
      <div className="w-full max-w-[420px] p-8 bg-white rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/favicon.svg" alt="CyberFate" className="w-8 h-8 inline-block" />
          <span className="text-xl font-bold text-[#1C1A16] ml-2">CyberFate</span>
        </div>

        {/* Loading */}
        {pageState === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <svg className="animate-spin h-8 w-8 text-[#1C1A16] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[#6B6560] text-sm">正在验证重置链接...</p>
          </div>
        )}

        {/* Error State */}
        {pageState === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-[#1C1A16] mb-2">链接无效</h2>
            <p className="text-[#6B6560] text-sm text-center mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl bg-[#1C1A16] text-white text-sm font-medium hover:bg-[#1C1A16]/90 transition-colors"
            >
              重新获取
            </button>
          </div>
        )}

        {/* Success State */}
        {pageState === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-semibold text-[#1C1A16] mb-2">密码重置成功</h2>
            <p className="text-[#6B6560] text-sm text-center">2 秒后自动跳转首页...</p>
          </div>
        )}

        {/* Form State */}
        {pageState === 'form' && (
          <>
            <h2 className="text-2xl font-semibold text-[#1C1A16] text-center mb-2">重置密码</h2>
            <p className="text-[#6B6560] text-sm text-center mb-8">请输入您的新密码</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 新密码 */}
              <div>
                <label className="text-sm font-medium text-[#1C1A16] mb-2 block">新密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="至少8个字符"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    className={`${inputBaseClass} ${
                      errors.password ? 'border-red-400 focus:ring-red-400/10 focus:border-red-400' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1A16] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${errors.password ? 'text-red-500' : 'text-[#B8B4AE]'}`}>
                  {errors.password || '至少8个字符'}
                </p>
              </div>

              {/* 确认密码 */}
              <div>
                <label className="text-sm font-medium text-[#1C1A16] mb-2 block">确认新密码</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }}
                    className={`${inputBaseClass} ${
                      errors.confirmPassword ? 'border-red-400 focus:ring-red-400/10 focus:border-red-400' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1C1A16] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1C1A16] text-white text-sm font-medium hover:bg-[#1C1A16]/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? '重置中...' : '重置密码'}
              </button>

              {/* 返回登录 */}
              <a
                onClick={() => router.push('/')}
                className="block text-center text-[#6B6560] text-sm underline mt-4 cursor-pointer"
              >
                返回登录
              </a>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-full max-w-[420px] p-8 bg-white rounded-2xl shadow-lg text-center">
            <svg className="animate-spin h-8 w-8 text-[#1C1A16] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[#6B6560] text-sm">加载中...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

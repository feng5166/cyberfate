'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { EmailLoginForm } from '@/components/auth/EmailLoginForm'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/bazi'

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [agreed, setAgreed] = useState(false)

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
          setServerError(result.error)
          setLoading(false)
        } else {
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 shadow-lg max-sm:max-w-[360px] max-sm:p-6">
        {/* 标题区 */}
        <div className="text-center mb-6">
          <h1 className="text-[#1C1A16] text-2xl max-sm:text-xl font-semibold">
            登录 / 注册
          </h1>
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

export default function AuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="text-[#9B9590] text-sm">加载中...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

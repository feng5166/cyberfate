'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'unknown' | 'login' | 'register'>('unknown')
  const [checking, setChecking] = useState(false)

  const inputClass =
    'w-full px-4 py-3 bg-white border border-primary/20 rounded-lg text-primary placeholder-text-muted focus:outline-none focus:border-primary/60 transition-colors'

  const handleGoogle = async () => {
    if (!agreed) {
      setError('请先阅读并同意用户协议和隐私政策')
      return
    }
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  const checkEmail = async () => {
    if (!email) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setMode(data.exists ? 'login' : 'register')
    } catch {
      setError('检查失败，请重试')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      setError('请先阅读并同意用户协议和隐私政策')
      return
    }
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      if (result?.error) {
        setError('邮箱或密码错误')
        setLoading(false)
      } else {
        router.push(callbackUrl)
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (res.ok) {
          const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
          })
          if (!result?.error) {
            router.push(callbackUrl)
          }
        } else {
          const data = await res.json()
          setError(data.error || '注册失败')
          setLoading(false)
        }
      } catch {
        setError('注册失败，请重试')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">
            {mode === 'unknown' ? '登录 / 注册' : mode === 'login' ? '登录' : '注册'}
          </h1>
          <p className="text-muted text-sm">探索你的命运之旅</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full mb-6 px-4 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? '跳转中...' : '使用 Google 登录'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-muted">或使用邮箱</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={checkEmail}
              className={inputClass}
              required
            />
          </div>

          {mode !== 'unknown' && (
            <div>
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-xs text-muted">
              我已阅读并同意
              <a href="/terms" className="text-primary hover:underline">
                用户协议
              </a>
              和
              <a href="/privacy" className="text-primary hover:underline">
                隐私政策
              </a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || checking || mode === 'unknown'}
            className="w-full"
          >
            {loading
              ? '处理中...'
              : checking
              ? '检查中...'
              : mode === 'login'
              ? '登录'
              : mode === 'register'
              ? '注册'
              : '继续'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-alt flex items-center justify-center"><div className="text-primary">加载中...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}

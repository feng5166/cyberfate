'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestStripePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCheckout = async (plan: string) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await res.json()
      setResult(data)
      
      if (data.checkout_url) {
        // 可以选择自动跳转或手动点击
        console.log('Checkout URL:', data.checkout_url)
      }
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testPortal = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      setResult(data)
      
      if (data.portal_url) {
        console.log('Portal URL:', data.portal_url)
      }
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <a href="/auth/login" className="text-blue-600 underline">
            前往登录
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stripe 托管 API 测试</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">用户信息</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(session.user, null, 2)}
          </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">测试 Checkout Session</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => testCheckout('monthly')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              基础版（月）¥5
            </button>
            <button
              onClick={() => testCheckout('quarterly')}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              专业版（季）¥6
            </button>
            <button
              onClick={() => testCheckout('yearly')}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              尊享版（年）¥7
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">测试 Customer Portal</h2>
          <button
            onClick={testPortal}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            打开 Customer Portal
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">API 响应</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.checkout_url && (
              <a
                href={result.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                前往 Stripe Checkout →
              </a>
            )}
            
            {result.portal_url && (
              <a
                href={result.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-6 py-3 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                前往 Stripe Portal →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

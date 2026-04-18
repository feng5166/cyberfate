import { Suspense } from 'react'
import { isGoogleAuthEnabled } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default function AuthLoginPage() {
  const googleEnabled = isGoogleAuthEnabled
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="text-[#9B9590] text-sm">加载中...</div>
        </div>
      }
    >
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  )
}

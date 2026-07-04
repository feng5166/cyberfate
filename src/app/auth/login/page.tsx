import { Suspense } from 'react'
import { isGoogleAuthEnabled } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default function AuthLoginPage() {
  const googleEnabled = isGoogleAuthEnabled
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-brand-bg px-4">
          <div className="text-brand-gray text-sm">加载中...</div>
        </div>
      }
    >
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  )
}

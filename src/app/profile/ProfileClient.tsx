'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ProfileClientProps {
  email: string
  vip: boolean
  expireAt: string | null
  baziAiCount: number
  limit: number | null
}

export default function ProfileClient({ email, vip, expireAt, baziAiCount, limit }: ProfileClientProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background-alt py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <span className="text-4xl">👤</span>
          <h1 className="font-heading text-2xl font-bold text-primary mt-3">个人中心</h1>
        </div>

        {/* 账号信息 */}
        <Card>
          <h2 className="text-secondary text-sm mb-4 uppercase tracking-wider">账号信息</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyber-gold/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              {email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-primary">{email}</p>
              <p className="text-muted text-xs mt-0.5">邮箱账号</p>
            </div>
          </div>
        </Card>

        {/* 会员状态 */}
        <Card variant={vip ? 'highlight' : 'default'}>
          <h2 className="text-secondary text-sm mb-4 uppercase tracking-wider">会员状态</h2>
          {vip ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-primary text-lg">★</span>
                <span className="text-primary font-semibold">VIP 会员</span>
              </div>
              <p className="text-muted text-sm">
                有效期至 <span className="text-primary">{expireAt}</span>
              </p>
              <p className="text-muted text-sm">AI 解读次数：无限制</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-muted text-lg">○</span>
                <span className="text-secondary font-semibold">免费用户</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted text-sm">今日剩余 AI 解读次数</p>
                <span className="text-primary font-bold text-lg">
                  {Math.max(0, (limit ?? 1) - baziAiCount)}
                  <span className="text-muted text-sm font-normal"> / {limit}</span>
                </span>
              </div>
              <Button
                className="w-full"
                onClick={() => router.push('/pricing')}
              >
                升级 VIP
              </Button>
            </div>
          )}
        </Card>

        {/* 退出登录 */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleSignOut}
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}

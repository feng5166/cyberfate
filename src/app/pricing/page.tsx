import type { Metadata } from 'next'
import { Suspense } from 'react'
import PricingPageClient from '@/components/pricing/PricingPageClient'

export const metadata: Metadata = {
  title: '会员定价 | 赛博命理师 CyberFate — 解锁全部 AI 命理功能',
  description: '赛博命理师 CyberFate 会员方案，解锁八字深度分析、紫微斗数命盘、六爻占卜、塔罗解读等全部 AI 命理功能。支持月付与年付，随时可取消。',
  keywords: ['命理会员', 'AI命理订阅', 'CyberFate会员', '八字分析会员', '命理定价'],
  alternates: { canonical: 'https://www.cyberfate.me/pricing' },
  openGraph: { title: '会员定价 | CyberFate', description: '解锁全部 AI 命理功能，月付年付随心选。', type: 'website', url: 'https://www.cyberfate.me/pricing' },
}

// 性能：定价页是纯营销页，原先页级 getServerSession + getSubscription 只为算一个
// 「当前套餐」角标，却把整页拖成全动态渲染（每次访问都要跑 JWT 解密 + 一次 PG 查询）。
// 会话依赖已下沉到 PricingPageClient（useSession + 按需拉 /api/subscription/current），
// 本页遂恢复静态渲染，首屏直接走 CDN。
export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageClient />
    </Suspense>
  )
}

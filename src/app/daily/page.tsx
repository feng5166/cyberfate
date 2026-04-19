import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '每日运势',
  description: '今日运势吉凶分析，基于生辰八字推算每日综合运势、事业、感情、财运与健康指数',
  keywords: ['每日运势', '今日运势', '日运', '运势分析', '八字运势'],
  openGraph: {
    title: '每日运势',
    description: '今日运势吉凶分析，基于生辰八字推算每日综合运势、事业、感情、财运与健康指数',
    type: 'website',
  },
}

export default function DailyPage() {
  return <PageClient />
}

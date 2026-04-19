import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '八字排盘分析',
  description: 'AI驱动的八字命理分析，精准解读四柱八字，深度分析性格特征、事业方向、感情运势与健康状况',
  keywords: ['八字排盘', '八字分析', '四柱八字', '命理分析', 'AI命理'],
  openGraph: {
    title: '八字排盘分析',
    description: 'AI驱动的八字命理分析，精准解读四柱八字，深度分析性格特征、事业方向、感情运势与健康状况',
    type: 'website',
  },
}

export default function BaziPage() {
  return <PageClient />
}

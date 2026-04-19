import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '六爻占卜',
  description: '六爻预测，传统六爻卦象精准解析，AI深度推演事业、感情、财运发展走势',
  keywords: ['六爻占卜', '六爻预测', '卦象', '占卜'],
  openGraph: {
    title: '六爻占卜',
    description: '六爻预测，传统六爻卦象精准解析，AI深度推演事业、感情、财运发展走势',
    type: 'website',
  },
}

export default function LiuyaoPage() {
  return <PageClient />
}

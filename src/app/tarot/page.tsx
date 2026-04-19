import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '塔罗占卜',
  description: 'AI解读塔罗牌阵，支持经典单牌、凯尔特十字等多种牌阵，深度解析牌意与人生指引',
  keywords: ['塔罗占卜', '塔罗牌', 'AI塔罗', '占卜', '牌阵解读'],
  openGraph: {
    title: '塔罗占卜',
    description: 'AI解读塔罗牌阵，支持经典单牌、凯尔特十字等多种牌阵，深度解析牌意与人生指引',
    type: 'website',
  },
}

export default function TarotPage() {
  return <PageClient />
}

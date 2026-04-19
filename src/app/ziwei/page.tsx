import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '紫微斗数',
  description: '紫微斗数命盘分析，AI精准排盘解读十二宫位，全面分析命运格局与人生走势',
  keywords: ['紫微斗数', '紫微命盘', '斗数排盘', '命盘分析'],
  openGraph: {
    title: '紫微斗数',
    description: '紫微斗数命盘分析，AI精准排盘解读十二宫位，全面分析命运格局与人生走势',
    type: 'website',
  },
}

export default function ZiweiPage() {
  return <PageClient />
}

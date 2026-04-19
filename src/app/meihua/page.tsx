import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '梅花易数',
  description: '梅花易数占卜，通过起卦分析事物发展走势，AI辅助解读卦象，预测吉凶趋势',
  keywords: ['梅花易数', '易数占卜', '起卦', '卦象解读'],
  openGraph: {
    title: '梅花易数',
    description: '梅花易数占卜，通过起卦分析事物发展走势，AI辅助解读卦象，预测吉凶趋势',
    type: 'website',
  },
}

export default function MeihuaPage() {
  return <PageClient />
}

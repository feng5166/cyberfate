import type { Metadata } from 'next'
import PageClient from './PageClient'

export const metadata: Metadata = {
  title: '老黄历',
  description: '传统黄历+AI智能问事，查询每日宜忌、神煞吉时，结合AI深度解析黄历智慧',
  keywords: ['老黄历', '黄历', '宜忌', 'AI问事', '吉时'],
  openGraph: {
    title: '老黄历',
    description: '传统黄历+AI智能问事，查询每日宜忌、神煞吉时，结合AI深度解析黄历智慧',
    type: 'website',
  },
}

export default function HuangliPage() {
  return <PageClient />
}

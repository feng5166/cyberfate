import type { Metadata } from 'next';
import PageClient from './PageClient';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: '人生K线合盘对比 | 赛博命理师 CyberFate — 两个人的运势曲线叠加',
  description:
    '把你和 TA 的人生K线叠在同一张图上：同频指数、最同步的十年、运势交叉年一目了然。基于八字命理的双人百年运势对比，免费在线生成。',
  keywords: ['人生K线合盘', '运势对比', '双人运势', '情侣运势', '八字合盘', '运势同频'],
  alternates: { canonical: 'https://www.cyberfate.me/life-kline/compare' },
  openGraph: {
    title: '人生K线合盘对比 | 赛博命理师 CyberFate',
    description: '两个人的百年运势曲线叠加对比，看你们何时同频、何处交汇。',
    type: 'website',
    url: 'https://www.cyberfate.me/life-kline/compare',
  },
};

export default function LifeKlineComparePage() {
  return (
    <>
      <PageClient />
      <Footer />
    </>
  );
}

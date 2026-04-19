import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '塔罗牌占卜',
  description: 'AI 驱动的塔罗牌解读，输入问题即可获得专业牌阵分析。三张牌阵、凯尔特十字等多种牌阵，AI 结合东方命理深度解析过去、现在与未来。',
};

export default function TarotLayout({ children }: { children: React.ReactNode }) {
  return children;
}

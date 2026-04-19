import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '紫微斗数',
  description: 'AI 紫微斗数命盘分析，输入出生年月日时，AI 自动排列十二宫位，深度解读命宫主星、大限流年，全面分析事业财运、婚姻感情与健康。',
};

export default function ZiweiLayout({ children }: { children: React.ReactNode }) {
  return children;
}

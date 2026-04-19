import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '六爻占卜',
  description: 'AI 六爻占卜，传承千年纳甲六爻体系，通过铜钱摇卦起卦，AI 结合世应爻、用神、六亲关系深度解盘，预测事业、婚姻、财运走势。',
};

export default function LiuyaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '梅花易数',
  description: 'AI 梅花易数占卜，基于宋代邵雍《梅花易数》体系，输入起卦时间或随机起卦，AI 深度解析卦象、爻辞，解答事业、财运、感情等人生疑惑。',
};

export default function MeihuaLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { knowledgeList } from '@/data/knowledge';
import { KnowledgeListClient } from './KnowledgeListClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '命理知识库 | 赛博命理师 CyberFate — 八字命理基础入门',
  description:
    '系统学习八字命理基础知识：五行理论、十天干、十二地支、八字格局、大运流年、梅花易数、六爻占卜。传统智慧结合现代 AI 解读，深入浅出。',
  keywords: [
    '八字命理知识',
    '五行理论',
    '十天干十二地支',
    '八字格局',
    '大运流年',
    '命理入门',
    '梅花易数基础',
    '六爻入门',
  ],
  openGraph: {
    title: '命理知识库 | 赛博命理师 CyberFate',
    description: '系统学习八字命理基础：五行、天干地支、格局、大运。传统智慧 × 现代 AI 解读。',
    type: 'website',
    url: 'https://www.cyberfate.me/knowledge',
  },
  alternates: {
    canonical: 'https://www.cyberfate.me/knowledge',
  },
};

export default function KnowledgePage() {
  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* 页面标题区 — Server Component，爬虫可抓 */}
      <section className="relative overflow-hidden text-center pt-16 md:pt-20 pb-6">
        {/* 罗盘细线装饰（品牌母题，克制） */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] md:w-[440px] md:h-[440px] opacity-[0.05]"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="196" fill="none" stroke="#1C1A16" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="#1C1A16" strokeWidth="0.6" strokeDasharray="2 4" />
            {Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1="200" y1="4" x2="200" y2={i % 2 === 0 ? 14 : 9}
                stroke="#1C1A16" strokeWidth="1"
                transform={`rotate(${i * 15} 200 200)`}
              />
            ))}
          </svg>
        </div>
        <h1 className="relative font-display text-3xl md:text-[40px] font-bold text-brand-ink tracking-[0.08em]">
          命理知识库
        </h1>
        <p className="relative text-sm md:text-base text-[#1C1A16]/55 tracking-wider mt-3">
          了解八字命理的理论基础，深入传统智慧
        </p>
        {/* 静态文章列表摘要 — 爬虫友好 */}
        <div className="sr-only">
          <p>本知识库收录命理基础文章，包括：</p>
          <ul>
            {knowledgeList.map((a) => (
              <li key={a.slug}>
                <a href={`/knowledge/${a.slug}`}>{a.title}</a>：{a.desc}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Container>
        {/* 搜索 + 筛选 + 文章列表（交互部分用 Client Component；网格内部自行放宽到 6xl） */}
        <KnowledgeListClient articles={knowledgeList} />
      </Container>

      {/* 说明区 — Server Component，爬虫可抓；色带区块打破单色 */}
      <section className="bg-[#F6F4F1] py-12 md:py-16">
        <Container>
          <div className="max-w-page mx-auto">
            <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-7">
              <h2 className="font-display text-lg font-semibold text-brand-ink tracking-[0.08em] mb-4">
                💡 知识库说明
              </h2>
              <ul className="space-y-2 text-sm text-[#1C1A16]/70 leading-relaxed">
                <li>• 本知识库内容来源于传统命理典籍，结合现代通俗解读</li>
                <li>• 仅供学习参考，不代表本站观点或立场</li>
                <li>• 命理学是一种传统文化，建议理性看待，不要过度迷信</li>
                <li>• 知识内容持续更新中，欢迎反馈建议</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

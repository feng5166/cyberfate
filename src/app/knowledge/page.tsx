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
      <section className="text-center pt-16 md:pt-20 pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-7 h-7 text-brand-ink/40" />
          <h1
            className="font-display text-h1 md:text-[44px] text-brand-ink"
            style={{ letterSpacing: '10px' }}
          >
            命理知识库
          </h1>
        </div>
        <p className="text-body-sm text-brand-gray mt-3">
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

        {/* 说明区 — Server Component，爬虫可抓；保持窄居中(page) */}
        <div className="max-w-page mx-auto">
          <div className="bg-white rounded-card border border-brand-border-light p-7 mb-16">
            <h2 className="font-display text-lg font-semibold text-brand-ink tracking-[0.08em] mb-4">
              💡 知识库说明
            </h2>
            <ul className="space-y-2 text-sm text-brand-gray leading-relaxed">
              <li>• 本知识库内容来源于传统命理典籍，结合现代通俗解读</li>
              <li>• 仅供学习参考，不代表本站观点或立场</li>
              <li>• 命理学是一种传统文化，建议理性看待，不要过度迷信</li>
              <li>• 知识内容持续更新中，欢迎反馈建议</li>
            </ul>
          </div>
        </div>
      </Container>

      <Footer />
    </div>
  );
}

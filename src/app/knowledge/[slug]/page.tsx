import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { knowledgeData, knowledgeList } from '@/data/knowledge';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { KnowledgeDetailClient } from './KnowledgeDetailClient';

// ============================================================
// 静态参数生成
// ============================================================
export async function generateStaticParams() {
  return Object.keys(knowledgeData).map((slug) => ({ slug }));
}

// ============================================================
// SEO Metadata
// ============================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = knowledgeData[slug.toLowerCase()];
  if (!article) {
    return { title: '页面不存在 | CyberFate' };
  }
  return {
    title: `${article.title} | 赛博命理师 CyberFate — AI 命理知识库`,
    description: article.description,
    openGraph: {
      title: `${article.title} | 赛博命理师 CyberFate`,
      description: article.description,
      type: 'article',
    },
  };
}

// ============================================================
// 文章详情页（Server Component）
// ============================================================
export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = knowledgeData[slug.toLowerCase()];

  if (!article) {
    notFound();
  }

  // 相关文章
  const relatedArticles = article.relatedSlugs
    .map((s) => ({ slug: s, ...knowledgeData[s] }))
    .filter(Boolean)
    .slice(0, 4);

  // 目录
  const toc = article.sections.map((s) => ({
    id: s.id,
    text: s.heading,
  }));

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* ====== 面包屑导航 ====== */}
      <Container>
        <nav className="flex items-center gap-2 text-sm py-6 text-[#1C1A16]/60">
          <Link href="/" className="hover:text-[#1C1A16] transition-colors">
            首页
          </Link>
          <span>/</span>
          <Link href="/knowledge" className="hover:text-[#1C1A16] transition-colors">
            知识库
          </Link>
          <span>/</span>
          <span className="text-[#1C1A16] font-medium truncate max-w-[200px]">
            {article.title}
          </span>
        </nav>
      </Container>

      {/* ====== 文章标题区 ====== */}
      <Container>
        <div className="max-w-3xl pb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{article.emoji}</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1C1A16]/5 text-[#1C1A16]/70 border border-[#1C1A16]/10">
              {article.categoryLabel}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1C1A16] leading-tight mb-4 tracking-wide">
            {article.title}
          </h1>
          <p className="text-lg text-[#1C1A16]/70 leading-relaxed mb-6">
            {article.subtitle}
          </p>
          <div className="flex items-center gap-4 text-sm text-[#1C1A16]/50">
            <time dateTime={article.date}>
              {new Date(article.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{article.readTime}</span>
            <span>·</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-[#1C1A16]/5 text-[#1C1A16]/60">
              {article.categoryLabel}
            </span>
          </div>
        </div>
      </Container>

      {/* ====== 双栏布局（含交互的部分用 Client Component） ====== */}
      <KnowledgeDetailClient
        article={article}
        toc={toc}
        relatedArticles={relatedArticles}
      />

      <Footer />
    </div>
  );
}

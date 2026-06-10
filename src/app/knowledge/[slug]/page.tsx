import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { knowledgeData, knowledgeList } from '@/data/knowledge';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { KnowledgeDetailClient } from './KnowledgeDetailClient';

export const dynamic = 'force-static';

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
  const articleUrl = `https://www.cyberfate.me/knowledge/${slug}`;
  return {
    title: `${article.title} | 赛博命理师 CyberFate — AI 命理知识库`,
    description: article.description,
    keywords: [article.title, article.categoryLabel, '命理知识', '八字命理', 'CyberFate', '赛博命理师'],
    alternates: { canonical: articleUrl },
    openGraph: {
      title: `${article.title} | 赛博命理师 CyberFate`,
      description: article.description,
      type: 'article',
      url: articleUrl,
      publishedTime: article.date,
      section: article.categoryLabel,
    },
    twitter: {
      card: 'summary',
      title: `${article.title} | CyberFate`,
      description: article.description,
    },
  };
}

// ============================================================
// 文章详情页（Server Component）
// ============================================================
const baseUrl = 'https://www.cyberfate.me';

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

  const articleUrl = `${baseUrl}/knowledge/${slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${articleUrl}#article`,
    headline: article.title,
    description: article.description,
    url: articleUrl,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: 'zh-CN',
    author: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'CyberFate 命理研究组',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: '赛博命理师 CyberFate',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: article.categoryLabel,
    keywords: article.title,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '知识库',
        item: `${baseUrl}/knowledge`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#1C1A16]/8">
            <div className="w-7 h-7 rounded-full bg-[#C8956C]/15 flex items-center justify-center text-xs font-bold text-[#C8956C]">
              CF
            </div>
            <div className="text-sm">
              <span className="text-[#1C1A16]/80 font-medium">CyberFate 命理研究组</span>
              <span className="text-[#1C1A16]/40 mx-2">·</span>
              <span className="text-[#1C1A16]/50">融合传统命理典籍与现代 AI 分析，持续更新</span>
            </div>
          </div>
        </div>
      </Container>

      {/* ====== 双栏布局（含交互的部分用 Client Component） ====== */}
      <KnowledgeDetailClient
        article={article}
        slug={slug}
        toc={toc}
        relatedArticles={relatedArticles}
      />

      <Footer />
    </div>
  );
}

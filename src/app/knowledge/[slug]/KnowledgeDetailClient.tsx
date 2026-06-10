'use client';

import Link from 'next/link';
import DOMPurify from 'dompurify';
import { knowledgeData } from '@/data/knowledge';
import { Container } from '@/components/ui/Container';

interface Article {
  title: string;
  emoji: string;
  subtitle: string;
  category: 'basic' | 'advanced' | 'tool';
  categoryLabel: string;
  readTime: string;
  description: string;
  date: string;
  cta: { text: string; href: string; btnText: string };
  sections: { id: string; heading: string; content: string; items?: string[] }[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

interface TocItem {
  id: string;
  text: string;
}

interface RelatedArticle {
  slug: string;
  title: string;
  emoji: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  readTime: string;
  description: string;
  date: string;
  cta: { text: string; href: string; btnText: string };
  sections: { id: string; heading: string; content: string; items?: string[] }[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

export function KnowledgeDetailClient({
  article,
  toc,
  relatedArticles,
}: {
  article: Article;
  toc: TocItem[];
  relatedArticles: RelatedArticle[];
}) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Container>
        <div className="flex flex-col lg:flex-row gap-10 pb-16">
          {/* 左侧正文 */}
          <main className="flex-1 min-w-0 max-w-3xl">
            <article className="bg-white rounded-2xl border border-[#1C1A16]/8 p-7 md:p-10">
              {/* 移动端目录 Tab */}
              <div className="lg:hidden mb-8 sticky top-4 z-10 -mx-7 md:-mx-10 px-7 md:px-10 pt-4 pb-2 bg-white rounded-b-2xl border-b border-[#1C1A16]/8">
                <details className="group" open>
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-[#1C1A16] list-none py-2">
                    <span>📑 目录</span>
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <ul className="space-y-2 pb-4">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-sm text-[#1C1A16]/60 hover:text-[#1C1A16] transition-colors block py-1 text-left w-full"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              {/* 正文内容 */}
              <div className="article-content text-base leading-relaxed text-[#1C1A16]/85">
                {article.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-24 mb-10">
                    <h2 className="font-serif text-xl font-semibold text-[#1C1A16] mb-4 tracking-wide">
                      {section.heading}
                    </h2>
                    {section.content && (
                      <p
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ALLOWED_TAGS: ['p','br','strong','em','b','i','u','a','ul','ol','li','h3','h4','span','div'], ALLOWED_ATTR: ['class','href','target','rel'] }) }}
                        className="mb-4"
                      />
                    )}
                    {section.items && section.items.length > 0 && (
                      <ul className="space-y-3 ml-1">
                        {section.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex gap-3 text-[#1C1A16]/80"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(`<span class="mt-2 min-w-[6px] h-[6px] rounded-full bg-[#1C1A16]/30 flex-shrink-0"></span><div>${item}</div>`, { ALLOWED_TAGS: ['p','br','strong','em','b','i','u','a','ul','ol','li','h3','h4','span','div'], ALLOWED_ATTR: ['class','href','target','rel'] }),
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* CTA 卡片 */}
              <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#F5EFE6] to-[#EDE3D5] border border-[#C8956C]/20">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">✦</span>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold mb-2 text-[#1C1A16]">
                      立即体验{article.title.includes('时') ? '相关功能' : article.title.replace('理论', '')}
                    </h3>
                    <p className="text-[#1C1A16]/65 text-sm leading-relaxed mb-4">
                      {article.cta.text}
                    </p>
                    <Link
                      href={article.cta.href}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8956C] text-white rounded-lg font-medium text-sm hover:bg-[#B07D58] transition-colors"
                    >
                      {article.cta.btnText}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {/* FAQ 区域 */}
              {article.faq.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-serif text-xl font-semibold text-[#1C1A16] mb-6 tracking-wide">
                    ❓ 常见问题
                  </h2>
                  <div className="space-y-4">
                    {article.faq.map((item, idx) => (
                      <details
                        key={idx}
                        className="group bg-[#FAF9F6] rounded-xl border border-[#1C1A16]/6 overflow-hidden"
                      >
                        <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-medium text-[#1C1A16] list-none hover:bg-[#1C1A16]/3 transition-colors">
                          <span>{item.q}</span>
                          <svg
                            className="w-4 h-4 text-[#1C1A16]/40 transition-transform group-open:rotate-180 flex-shrink-0 ml-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="px-5 pb-4 text-sm text-[#1C1A16]/70 leading-relaxed">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </main>

          {/* 右侧侧边栏（桌面端） */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* 目录卡片 */}
              <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-6 shadow-none">
                <h3 className="font-serif text-base font-semibold text-[#1C1A16] mb-4 tracking-wide">
                  📑 目录
                </h3>
                <nav>
                  <ul className="space-y-2.5">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-sm text-[#1C1A16]/60 hover:text-[#1C1A16] transition-colors block py-1 rounded-md hover:bg-[#1C1A16]/3 text-left w-full"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* 相关推荐 */}
              {relatedArticles.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-6 shadow-none">
                  <h3 className="font-serif text-base font-semibold text-[#1C1A16] mb-4 tracking-wide">
                    📚 相关文章
                  </h3>
                  <div className="space-y-3">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/knowledge/${rel.slug}`}
                        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#FAF9F6] transition-colors"
                      >
                        <span className="text-xl mt-0.5">{rel.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1C1A16] group-hover:text-[#1C1A16]/80 transition-colors line-clamp-2">
                            {rel.title}
                          </p>
                          <p className="text-xs text-[#1C1A16]/50 mt-1">
                            {rel.readTime}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 返回知识库 */}
              <Link
                href="/knowledge"
                className="block bg-white rounded-2xl border border-[#1C1A16]/8 p-6 text-center text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] hover:shadow-card-hover transition-all duration-300 shadow-none"
              >
                ← 返回知识库首页
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

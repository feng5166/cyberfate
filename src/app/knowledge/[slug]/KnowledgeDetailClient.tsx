'use client';

import Link from 'next/link';
import DOMPurify from 'dompurify';
import { knowledgeData } from '@/data/knowledge';

// SSR-safe sanitize: DOMPurify 只在客户端可用
function safeSanitize(html: string, options?: Record<string, unknown>): string {
  if (typeof window === 'undefined') return html;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (DOMPurify as any).sanitize(html, options) as string;
}
import { Container } from '@/components/ui/Container';

// 相关工具映射表
const TOOL_INFO: Record<string, { name: string; desc: string; emoji: string; href: string }> = {
  bazi:    { name: '八字分析', desc: '根据生辰时间推算命局、格局与大运', emoji: '☀️', href: '/bazi' },
  tarot:   { name: '塔罗占卜', desc: '抽牌辞南 · 结合 AI 解读凯尔特布阵', emoji: '🃏', href: '/tarot' },
  ziwei:   { name: '紫微斗数', desc: '星盘命盘相互参照，一生走势总览', emoji: '⭐', href: '/ziwei' },
  meihua:  { name: '梅花易数', desc: '起卦时刻解占，即问即答', emoji: '🌸', href: '/meihua' },
  liuyao:  { name: '六爻占卜', desc: '摇铜钱起卦，六爻分析五行生克', emoji: '☯️', href: '/liuyao' },
  huangli: { name: '黄历查询', desc: '宜忌宜忌日期选择参考', emoji: '📅', href: '/huangli' },
};

// 根据文章 slug 返回推荐工具 key 列表
function getRelatedTools(slug: string, category: string): string[] {
  if (slug.startsWith('shengxiao-')) return ['bazi', 'ziwei', 'huangli'];
  if (category === 'basic') return ['bazi', 'ziwei'];
  if (category === 'advanced') return ['bazi', 'tarot', 'liuyao'];
  if (slug === 'zhenyang' || slug === 'zaowan') return ['bazi'];
  return ['bazi', 'ziwei', 'tarot'];
}

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
  slug,
  toc,
  relatedArticles,
}: {
  article: Article;
  slug: string;
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
            <article className="bg-white rounded-card border border-brand-border-light p-7 md:p-10">
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
                        dangerouslySetInnerHTML={{ __html: safeSanitize(section.content, { ALLOWED_TAGS: ['p','br','strong','em','b','i','u','a','ul','ol','li','h3','h4','span','div'], ALLOWED_ATTR: ['class','href','target','rel'] }) }}
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
                              __html: safeSanitize(`<span class="mt-2 min-w-[6px] h-[6px] rounded-full bg-[#1C1A16]/30 flex-shrink-0"></span><div>${item}</div>`, { ALLOWED_TAGS: ['p','br','strong','em','b','i','u','a','ul','ol','li','h3','h4','span','div'], ALLOWED_ATTR: ['class','href','target','rel'] }),
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* 相关工具内链 */}
              {(() => {
                const tools = getRelatedTools(slug, article.category).map(k => TOOL_INFO[k]).filter(Boolean);
                return tools.length > 0 ? (
                  <div className="mt-10 mb-2">
                    <h2 className="font-serif text-lg font-semibold text-[#1C1A16] mb-4 tracking-wide">✦ 相关工具</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="flex items-start gap-3 p-4 rounded-xl border border-brand-border-light bg-white hover:border-brand-accent/40 hover:shadow-sm transition-all duration-200 group"
                        >
                          <span className="text-2xl mt-0.5">{tool.emoji}</span>
                          <div>
                            <div className="text-sm font-medium text-brand-ink group-hover:text-brand-accent transition-colors">{tool.name}</div>
                            <div className="text-xs text-[#1C1A16]/50 mt-0.5 leading-relaxed">{tool.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* CTA 卡片 */}
              <div className="mt-12 p-6 md:p-8 rounded-card bg-brand-accent-soft border border-brand-accent/20">
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
                      className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-brand-accent text-white rounded-lg font-medium text-sm hover:bg-brand-accent-hover transition-colors"
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
              <div className="bg-white rounded-card border border-brand-border-light p-6 shadow-none">
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
                <div className="bg-white rounded-card border border-brand-border-light p-6 shadow-none">
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
                className="block bg-white rounded-card border border-brand-border-light p-6 text-center text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] hover:shadow-card-hover transition-all duration-300 shadow-none"
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

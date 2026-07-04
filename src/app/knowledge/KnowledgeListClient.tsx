'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { KnowledgeListItem } from '@/data/knowledge';

type CategoryFilter = 'all' | 'basic' | 'advanced' | 'tool';

const categoryTabs: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'basic', label: '基础概念' },
  { value: 'advanced', label: '八字进阶' },
  { value: 'tool', label: '实用工具' },
];

const categoryEmoji: Record<CategoryFilter, string> = {
  all: '📖',
  basic: '📗',
  advanced: '📘',
  tool: '📙',
};

export function KnowledgeListClient({ articles }: { articles: KnowledgeListItem[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchCategory = activeCategory === 'all' || article.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.categoryLabel.includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery, articles]);

  return (
    <>
      {/* 搜索框 */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light pointer-events-none" />
          <input
            type="text"
            placeholder="搜索文章标题或关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-12 pr-11 py-3 rounded-full border border-brand-border bg-white text-base text-brand-ink placeholder:text-brand-gray focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="清除搜索"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-brand-gray hover:text-brand-ink hover:bg-brand-bg transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 分类筛选 Tab — 窄屏可横向滚动，避免 ≤360px 溢出 */}
      <div className="flex justify-center mb-10">
        <div
          role="group"
          aria-label="文章分类筛选"
          className="inline-flex items-center max-w-full overflow-x-auto scrollbar-hide bg-white rounded-full border border-brand-border p-1"
        >
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={activeCategory === tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`relative shrink-0 whitespace-nowrap inline-flex items-center justify-center min-h-[44px] px-5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === tab.value
                  ? 'bg-brand-accent-tint text-brand-ink ring-[1.5px] ring-inset ring-brand-accent'
                  : 'text-brand-gray hover:text-brand-ink hover:bg-brand-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 结果计数 */}
      <div className="text-center mb-6">
        <span className="text-xs text-brand-gray">
          {categoryEmoji[activeCategory]} 共 {filteredArticles.length} 篇文章
          {searchQuery && ` · 搜索"${searchQuery}"`}
        </span>
      </div>

      {/* 文章网格 */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/knowledge/${article.slug}`} className="group">
              <Card interactive className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{article.emoji}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-bg text-brand-gray border border-brand-border-light">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-brand-ink tracking-[0.08em] mb-2 transition-colors group-hover:text-brand-accent">
                  {article.title}
                </h2>
                <p className="text-sm text-brand-gray leading-relaxed flex-1">{article.desc}</p>
                <div className="mt-4 pt-4 border-t border-brand-border-light">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-border-light text-brand-gray">
                    {article.categoryLabel}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 pb-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-brand-gray text-sm">没有找到匹配的文章</p>
          <button
            type="button"
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="mt-4 inline-flex items-center justify-center min-h-[44px] px-2 text-sm text-brand-accent hover:text-brand-accent-hover underline transition-colors"
          >
            清除筛选条件
          </button>
        </div>
      )}
    </>
  );
}

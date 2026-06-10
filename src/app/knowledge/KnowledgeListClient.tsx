'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock } from 'lucide-react';
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1C1A16]/30" />
          <input
            type="text"
            placeholder="搜索文章标题或关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-[#1C1A16]/15 bg-white text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/35 focus:outline-none focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/5 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1C1A16]/35 hover:text-[#1C1A16]/60 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 分类筛选 Tab */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center bg-white rounded-full border border-[#1C1A16]/10 p-1">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === tab.value
                  ? 'bg-[#1C1A16] text-white shadow-sm'
                  : 'text-[#1C1A16]/60 hover:text-[#1C1A16] hover:bg-[#1C1A16]/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 结果计数 */}
      <div className="text-center mb-6">
        <span className="text-xs text-[#1C1A16]/40">
          {categoryEmoji[activeCategory]} 共 {filteredArticles.length} 篇文章
          {searchQuery && ` · 搜索"${searchQuery}"`}
        </span>
      </div>

      {/* 文章网格 */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/knowledge/${article.slug}`} className="group">
              <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-7 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{article.emoji}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF9F6] text-[#1C1A16]/50 border border-[#1C1A16]/6">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-[#1C1A16] tracking-[0.08em] mb-2 group-hover:underline">
                  {article.title}
                </h2>
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed flex-1">{article.desc}</p>
                <div className="mt-4 pt-4 border-t border-[#1C1A16]/5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1C1A16]/5 text-[#1C1A16]/60">
                    {article.categoryLabel}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 pb-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-[#1C1A16]/50 text-sm">没有找到匹配的文章</p>
          <button
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="mt-4 text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] underline transition-colors"
          >
            清除筛选条件
          </button>
        </div>
      )}
    </>
  );
}

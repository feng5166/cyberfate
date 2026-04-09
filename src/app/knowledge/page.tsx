'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { knowledgeList } from '@/data/knowledge';

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

export default function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 前端过滤
  const filteredArticles = useMemo(() => {
    return knowledgeList.filter((article) => {
      const matchCategory =
        activeCategory === 'all' || article.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.categoryLabel.includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* ====== 页面标题区 ====== */}
      <section className="text-center pt-16 md:pt-20 pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-7 h-7 text-[#1C1A16]/40" />
          <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>
            命理知识库
          </h1>
        </div>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">
          了解八字命理的理论基础，深入传统智慧
        </p>
      </section>

      <Container>
        {/* ====== 搜索框 ====== */}
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

        {/* ====== 分类筛选 Tab ====== */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-white rounded-full border border-[#1C1A16]/10 p-1 shadow-none">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === tab.value
                    ? 'bg-[#1C1A16] text-white shadow-sm'
                    : 'text-[#1C1A16]/60 hover:text-[#1C1A16] hover:bg-[#1C1A16]/3'
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

        {/* ====== 知识分类网格 ====== */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            {filteredArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-[#1C1A16]/8 shadow-none p-7 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{article.emoji}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF9F6] text-[#1C1A16]/50 border border-[#1C1A16]/6">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1C1A16] tracking-[0.08em] mb-2 group-hover:underline">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#1C1A16]/70 leading-relaxed flex-1">
                    {article.desc}
                  </p>
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
          /* 空状态 */
          <div className="text-center py-20 pb-12">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-[#1C1A16]/50 text-sm">没有找到匹配的文章</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] underline transition-colors"
            >
              清除筛选条件
            </button>
          </div>
        )}

        {/* 说明 */}
        <div className="bg-white rounded-2xl border border-[#1C1A16]/8 shadow-none p-7 mb-16">
          <h3 className="font-display text-lg font-semibold text-[#1C1A16] tracking-[0.08em] mb-4">
            💡 知识库说明
          </h3>
          <ul className="space-y-2 text-sm text-[#1C1A16]/70 leading-relaxed">
            <li>• 本知识库内容来源于传统命理典籍，结合现代通俗解读</li>
            <li>• 仅供学习参考，不代表本站观点或立场</li>
            <li>• 命理学是一种传统文化，建议理性看待，不要过度迷信</li>
            <li>• 知识内容持续更新中，欢迎反馈建议</li>
          </ul>
        </div>
      </Container>

      <Footer />
    </div>
  );
}

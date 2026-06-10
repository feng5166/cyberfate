// ============================================================
// 知识库文章类型定义
// ============================================================

export interface KnowledgeArticle {
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

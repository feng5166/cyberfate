import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export const metadata = {
  title: '命理知识库',
  description: '八字命理理论知识库，包含五行、天干地支、神煞、格局等传统命理学知识。',
};

const knowledgeCategories = [
  { title: '五行理论', slug: 'wuxing', emoji: '🌟', desc: '金木水火土的生克关系与特性' },
  { title: '十天干理论', slug: 'tiangan', emoji: '☀️', desc: '甲乙丙丁戊己庚辛壬癸的含义' },
  { title: '十二地支理论', slug: 'dizhi', emoji: '🌙', desc: '子丑寅卯辰巳午未申酉戌亥的奥秘' },
  { title: '神煞大全', slug: 'shensha', emoji: '⭐', desc: '各种神煞的意义与影响' },
  { title: '八字格局', slug: 'geju', emoji: '📊', desc: '正格、从格等命局格局' },
  { title: '刑冲会合法则', slug: 'xingchong', emoji: '🔀', desc: '地支六冲、三合、刑害关系' },
  { title: '大运理论', slug: 'dayun', emoji: '📈', desc: '十年一运的运程变化规律' },
  { title: '真太阳时理论', slug: 'solar-time', emoji: '🌅', desc: '什么是真太阳时，为何要修正' },
  { title: '早晚子时理论', slug: 'zishi', emoji: '⏰', desc: '子时的特殊计日方法' },
];

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      {/* 页面标题区 */}
      <section className="text-center pt-16 md:pt-20 pb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-7 h-7 text-[#1C1A16]/40" />
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1C1A16]">
            命理知识库
          </h1>
        </div>
        <p className="text-sm text-[#1C1A16]/60 mt-2">
          了解八字命理的理论基础，深入传统智慧
        </p>
      </section>

      <Container>
        {/* 知识分类网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {knowledgeCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/knowledge/${category.slug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl border border-[rgba(28,26,22,0.06)] p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.emoji}</div>
                  <h3 className="font-heading text-lg font-semibold text-[#1C1A16] mb-2 group-hover:underline">
                    {category.title}
                  </h3>
                  <p className="text-sm text-[#1C1A16]/60 leading-relaxed">
                    {category.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 说明 */}
        <div className="bg-white rounded-2xl border border-[rgba(28,26,22,0.06)] p-7 shadow-sm mb-16">
          <h3 className="font-heading text-lg font-semibold text-[#1C1A16] mb-4">
            💡 知识库说明
          </h3>
          <ul className="space-y-2 text-sm text-[#1C1A16]/60 leading-relaxed">
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

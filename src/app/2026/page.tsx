import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { PageShell } from '@/components/ui/PageShell';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';
import { BaziCtaCard, FaqSection, RankingHero, SectionHead, Y2026_FG } from './_shared';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '2026年生肖运势总览 | CyberFate — 丙午马年财运/事业/爱情排行',
  description:
    '2026丙午马年12生肖完整运势总览：财运、事业、爱情三大维度排行，覆盖12篇个人生肖深度解读，从命理角度看清丙午年大势。',
  keywords: [
    '2026年生肖运势',
    '丙午年运势',
    '马年运势',
    '2026十二生肖',
    '2026生肖排行',
    '2026最旺生肖',
    '2026本命年',
    '生肖运势总览',
  ],
  alternates: { canonical: 'https://www.cyberfate.me/2026' },
  openGraph: {
    title: '2026年生肖运势总览 | CyberFate',
    description: '2026丙午马年12生肖完整运势总览：财运/事业/爱情排行 + 12篇个人生肖深度解读。',
    type: 'website',
    url: 'https://www.cyberfate.me/2026',
  },
  twitter: {
    card: 'summary',
    title: '2026年生肖运势总览 | CyberFate',
    description: '2026丙午马年完整运势导航：财运、事业、爱情三大排行 + 12生肖详解。',
  },
};

const dimensions = [
  {
    title: '财运排行',
    href: '/2026/caiyun',
    summary: 'TOP 3：羊、虎、蛇',
    desc: '丙午火当令，谁的财库最旺？从五行相生与三合六合给出排行。',
  },
  {
    title: '事业运排行',
    href: '/2026/shiyeyun',
    summary: 'TOP 3：虎、马、蛇',
    desc: '寅午戌三合火局成立，本命年的马站到舞台中央——谁的事业上升最快？',
  },
  {
    title: '爱情运排行',
    href: '/2026/aiqingyun',
    summary: 'TOP 3：羊、兔、蛇',
    desc: '午未六合主桃花、卯为正桃花星——谁的感情运势在2026年最甜？',
  },
];

// tagColor：模块点缀色=受益生肖，墨灰=中性，红=风险（冲/害/本命年）。红色为语义状态标记，非装饰。
const allZodiacs = [
  { name: '生肖鼠', emoji: '🐭', slug: 'shengxiao-rat-2026', tag: '冲太岁', tagColor: 'text-red-700' },
  { name: '生肖牛', emoji: '🐮', slug: 'shengxiao-ox-2026', tag: '稳健积累', tagColor: 'text-[#1C1A16]/55' },
  { name: '生肖虎', emoji: '🐯', slug: 'shengxiao-tiger-2026', tag: '事业上升', tagColor: 'text-[#B45309] font-medium' },
  { name: '生肖兔', emoji: '🐰', slug: 'shengxiao-rabbit-2026', tag: '桃花旺', tagColor: 'text-[#B45309] font-medium' },
  { name: '生肖龙', emoji: '🐲', slug: 'shengxiao-dragon-2026', tag: '厚积薄发', tagColor: 'text-[#1C1A16]/55' },
  { name: '生肖蛇', emoji: '🐍', slug: 'shengxiao-snake-2026', tag: '同气相求', tagColor: 'text-[#B45309] font-medium' },
  { name: '生肖马', emoji: '🐴', slug: 'shengxiao-horse-2026', tag: '本命年', tagColor: 'text-red-700' },
  { name: '生肖羊', emoji: '🐏', slug: 'shengxiao-goat-2026', tag: '六合最佳', tagColor: 'text-[#B45309] font-medium' },
  { name: '生肖猴', emoji: '🐵', slug: 'shengxiao-monkey-2026', tag: '保守过渡', tagColor: 'text-[#1C1A16]/55' },
  { name: '生肖鸡', emoji: '🐔', slug: 'shengxiao-rooster-2026', tag: '稳守为主', tagColor: 'text-[#1C1A16]/55' },
  { name: '生肖狗', emoji: '🐶', slug: 'shengxiao-dog-2026', tag: '贵人提携', tagColor: 'text-[#B45309] font-medium' },
  { name: '生肖猪', emoji: '🐷', slug: 'shengxiao-pig-2026', tag: '亥午相害', tagColor: 'text-red-700' },
];

const faqItems = [
  {
    question: '2026年是什么年？哪些生肖最旺？',
    answer:
      '2026年农历是丙午年，俗称"马年"。从命理角度看，丙午为火气当令的强势年份。综合来看，生肖羊（午未六合）、生肖虎（寅午戌三合火局）、生肖蛇（巳午同气）、生肖兔（卯木生午火）整体运势最旺。',
  },
  {
    question: '2026年哪些生肖运势最差？',
    answer:
      '2026年子午相冲，生肖鼠是冲太岁的生肖，整体运势压力最大。生肖猪（亥午害）、生肖猴和生肖鸡（金被火克）也需要格外谨慎。生肖马是本命年，机遇与风险并存，需要稳准狠。',
  },
  {
    question: '本命年是什么意思？2026年生肖马要注意什么？',
    answer:
      '本命年是指自己的生肖与流年相同的年份。2026年生肖马为本命年，构成"午午自刑伏吟"，能量过载导致波动。建议穿戴红色饰物、佩戴太岁符或马形吉祥物，避免重大决策的同时把握平台跃迁的机会。',
  },
  {
    question: '生肖运势和八字运势有什么区别？',
    answer:
      '生肖运势只看出生年份的地支，是宏观参考，覆盖12种人；八字运势看完整的年月日时四柱，结合大运流年，能精准定位个人运势走向。建议先看生肖把握大方向，再用八字做个性化精准分析。',
  },
];

const faqJsonLd = faqItems.map((it) => ({ question: it.question, answer: it.answer }));

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '2026年生肖运势总览（丙午马年）',
  description:
    '2026丙午马年12生肖完整运势总览：财运、事业、爱情三大维度排行 + 12篇个人生肖深度解读。',
  author: { '@type': 'Organization', name: 'CyberFate' },
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
  datePublished: '2026-01-01',
  dateModified: '2026-06-10',
  inLanguage: 'zh-CN',
  mainEntityOfPage: 'https://www.cyberfate.me/2026',
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-brand-bg text-brand-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FaqJsonLd items={faqJsonLd} />

      {/* Hero */}
      <RankingHero
        title="2026年生肖运势总览"
        desc="丙午年，火气当令。从财运、事业、爱情三个维度，看看12生肖在丙午马年的运势分布。每个生肖都有专属深度解读，找到属于你的开运方向。"
      />

      {/* 三大维度 */}
      <section className="pt-2 pb-16">
        <Container>
          <SectionHead eyebrow="RANKINGS · 三大维度排行" title="2026 财运 · 事业 · 爱情" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {dimensions.map((d) => (
              <Link
                key={d.title}
                href={d.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: Y2026_FG }}
                />
                <h3 className="font-display text-2xl text-brand-ink mb-2">{d.title}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: Y2026_FG }}>{d.summary}</p>
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed mb-4 flex-1">{d.desc}</p>
                <span className="text-sm text-brand-ink">查看完整排行 →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 12生肖深度文章 */}
      <section className="pb-16">
        <Container>
          <div className="text-center mb-8">
            <SectionHead eyebrow="DEEP DIVE · 个人生肖解读" title="12生肖 2026 完整运势" />
            <p className="text-sm text-[#1C1A16]/55 -mt-4 max-w-xl mx-auto">
              每个生肖都有独立的丙午年深度解读，覆盖事业、财运、感情、健康四个维度。
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allZodiacs.map((z) => (
              <Link
                key={z.slug}
                href={`/knowledge/${z.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: Y2026_FG }}
                />
                <div className="text-4xl mb-2">{z.emoji}</div>
                <h3 className="font-display text-base text-brand-ink mb-1">{z.name}</h3>
                <p className={`text-xs ${z.tagColor}`}>{z.tag}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 命理总论（#F6F4F1 色带区块，打破整页单色） */}
      <section className="bg-[#F6F4F1] py-14 md:py-16 mb-16">
        <PageShell>
          <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-7">
            <h2 className="font-display text-2xl text-brand-ink mb-4">
              丙午年的命理总论
            </h2>
            <div className="space-y-4 text-sm text-[#1C1A16]/70 leading-relaxed">
              <p>
                2026年农历为<span className="font-medium text-[#B45309]">丙午年</span>，
                天干"丙"为太阳之火，地支"午"为正午之火，构成"火气当令"的强势格局。
              </p>
              <p>
                从十二地支的关系看，"午"与"未"形成<span className="font-medium text-[#B45309]">六合</span>，
                与"寅、戌"形成<span className="font-medium text-[#B45309]">三合火局</span>，
                与"巳"同气，与"卯"相生。这五个生肖（羊、虎、狗、蛇、兔）整体运势最为受益。
              </p>
              <p>
                反之，"午"与"子"<span className="font-medium text-[#B45309]">相冲</span>，
                与"亥"形成"<span className="font-medium text-[#B45309]">亥午害</span>"，
                与"申、酉"金被火克。这四个生肖（鼠、猪、猴、鸡）需要更加谨慎。
              </p>
              <p>
                生肖马自身遇到马年，构成"<span className="font-medium text-[#B45309]">午午自刑伏吟</span>"，
                是典型的本命年现象，机遇与风险并存。生肖龙、牛则是相对中性的稳健年份。
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-[#1C1A16]/6">
              <p className="text-xs font-medium text-[#1C1A16]/55 mb-3">延伸阅读 · 命理知识</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: '刑冲会合', href: '/knowledge/xingchong' },
                  { name: '五行理论', href: '/knowledge/wuxing' },
                  { name: '十二地支', href: '/knowledge/dizhi' },
                  { name: '十天干', href: '/knowledge/tiangan' },
                  { name: '神煞大全', href: '/knowledge/shensha' },
                  { name: '大运理论', href: '/knowledge/dayun' },
                ].map((t) => (
                  <Link key={t.href} href={t.href} className="text-xs px-3 py-1.5 rounded-full border border-[#1C1A16]/15 text-[#1C1A16]/60 hover:text-brand-ink hover:border-brand-ink/40 transition-colors bg-white">
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <PageShell>
          <BaziCtaCard
            title="想看清2026年个人精准运势？"
            desc="生肖只是宏观参考，真正决定个人运势的是完整八字（年月日时）。CyberFate 提供免费的八字详细分析，结合丙午年大势，给出针对你的具体行动建议。"
          />
        </PageShell>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <PageShell>
          <FaqSection items={faqItems} />
        </PageShell>
      </section>

      <Footer />
    </div>
  );
}

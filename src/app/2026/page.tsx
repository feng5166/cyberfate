import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';

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
    accent: 'from-[#FFE5C7] to-[#FFD09E]',
  },
  {
    title: '事业运排行',
    href: '/2026/shiyeyun',
    summary: 'TOP 3：虎、马、蛇',
    desc: '寅午戌三合火局成立，本命年的马站到舞台中央——谁的事业上升最快？',
    accent: 'from-[#FFD9C0] to-[#FFB988]',
  },
  {
    title: '爱情运排行',
    href: '/2026/aiqingyun',
    summary: 'TOP 3：羊、兔、蛇',
    desc: '午未六合主桃花、卯为正桃花星——谁的感情运势在2026年最甜？',
    accent: 'from-[#FBD9D5] to-[#F4B8B0]',
  },
];

const allZodiacs = [
  { name: '生肖鼠', emoji: '🐭', slug: 'shengxiao-rat-2026', tag: '冲太岁', tagColor: 'text-red-700' },
  { name: '生肖牛', emoji: '🐮', slug: 'shengxiao-ox-2026', tag: '稳健积累', tagColor: 'text-[#1C1A16]/60' },
  { name: '生肖虎', emoji: '🐯', slug: 'shengxiao-tiger-2026', tag: '事业上升', tagColor: 'text-[#8B5A2B]' },
  { name: '生肖兔', emoji: '🐰', slug: 'shengxiao-rabbit-2026', tag: '桃花旺', tagColor: 'text-[#8B5A2B]' },
  { name: '生肖龙', emoji: '🐲', slug: 'shengxiao-dragon-2026', tag: '厚积薄发', tagColor: 'text-[#1C1A16]/60' },
  { name: '生肖蛇', emoji: '🐍', slug: 'shengxiao-snake-2026', tag: '同气相求', tagColor: 'text-[#8B5A2B]' },
  { name: '生肖马', emoji: '🐴', slug: 'shengxiao-horse-2026', tag: '本命年', tagColor: 'text-red-700' },
  { name: '生肖羊', emoji: '🐏', slug: 'shengxiao-goat-2026', tag: '六合最佳', tagColor: 'text-[#8B5A2B]' },
  { name: '生肖猴', emoji: '🐵', slug: 'shengxiao-monkey-2026', tag: '保守过渡', tagColor: 'text-[#1C1A16]/60' },
  { name: '生肖鸡', emoji: '🐔', slug: 'shengxiao-rooster-2026', tag: '稳守为主', tagColor: 'text-[#1C1A16]/60' },
  { name: '生肖狗', emoji: '🐶', slug: 'shengxiao-dog-2026', tag: '贵人提携', tagColor: 'text-[#8B5A2B]' },
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16] font-serif">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FaqJsonLd items={faqJsonLd} />

      {/* Hero */}
      <section className="pt-20 pb-12">
        <Container>
          <div className="max-w-page mx-auto text-center">
            <p className="text-sm tracking-[0.3em] text-[#C8956C] mb-4">2026 · 丙午马年</p>
            <h1 className="font-heading text-3xl sm:text-5xl text-[#1C1A16] mb-5 leading-tight">
              2026年生肖运势总览
            </h1>
            <p className="text-base text-[#1C1A16]/75 leading-relaxed">
              丙午年，火气当令。从财运、事业、爱情三个维度，看看12生肖在丙午马年的运势分布。每个生肖都有专属深度解读，找到属于你的开运方向。
            </p>
          </div>
        </Container>
      </section>

      {/* 三大维度 */}
      <section className="pb-16">
        <Container>
          <div className="text-center mb-10">
            <p className="text-sm tracking-[0.2em] text-[#1C1A16]/60">RANKINGS · 三大维度排行</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#1C1A16] mt-2">
              2026 财运 · 事业 · 爱情
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dimensions.map((d) => (
              <Link key={d.title} href={d.href} className="block group">
                <Card
                  hover={true}
                  className={`relative overflow-hidden border-2 border-[#C8956C]/40 bg-gradient-to-br ${d.accent} h-full`}
                >
                  <h3 className="font-heading text-2xl text-[#1C1A16] mb-2">{d.title}</h3>
                  <p className="text-sm text-[#8B5A2B] font-medium mb-3">{d.summary}</p>
                  <p className="text-sm text-[#1C1A16]/75 leading-relaxed mb-4">{d.desc}</p>
                  <span className="text-sm text-[#1C1A16] group-hover:text-[#C8956C] transition-colors">
                    查看完整排行 →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 12生肖深度文章 */}
      <section className="pb-16">
        <Container>
          <div className="text-center mb-8">
            <p className="text-sm tracking-[0.2em] text-[#1C1A16]/60">DEEP DIVE · 个人生肖解读</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#1C1A16] mt-2">
              12生肖 2026 完整运势
            </h2>
            <p className="text-sm text-[#1C1A16]/65 mt-3 max-w-xl mx-auto">
              每个生肖都有独立的丙午年深度解读，覆盖事业、财运、感情、健康四个维度。
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allZodiacs.map((z) => (
              <Link key={z.slug} href={`/knowledge/${z.slug}`} className="block group">
                <Card hover={true} className="bg-white/95 text-center p-5">
                  <div className="text-4xl mb-2">{z.emoji}</div>
                  <h3 className="font-heading text-base text-[#1C1A16] mb-1">{z.name}</h3>
                  <p className={`text-xs ${z.tagColor}`}>{z.tag}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 命理总论 */}
      <section className="pb-16">
        <Container>
          <div className="max-w-page mx-auto">
            <Card hover={false} className="bg-white/90">
              <h2 className="font-heading text-2xl text-[#1C1A16] mb-4">
                丙午年的命理总论
              </h2>
              <div className="space-y-4 text-sm text-[#1C1A16]/80 leading-relaxed">
                <p>
                  2026年农历为<span className="text-[#8B5A2B] font-medium">丙午年</span>，
                  天干"丙"为太阳之火，地支"午"为正午之火，构成"火气当令"的强势格局。
                </p>
                <p>
                  从十二地支的关系看，"午"与"未"形成<span className="text-[#8B5A2B] font-medium">六合</span>，
                  与"寅、戌"形成<span className="text-[#8B5A2B] font-medium">三合火局</span>，
                  与"巳"同气，与"卯"相生。这五个生肖（羊、虎、狗、蛇、兔）整体运势最为受益。
                </p>
                <p>
                  反之，"午"与"子"<span className="text-[#8B5A2B] font-medium">相冲</span>，
                  与"亥"形成"<span className="text-[#8B5A2B] font-medium">亥午害</span>"，
                  与"申、酉"金被火克。这四个生肖（鼠、猪、猴、鸡）需要更加谨慎。
                </p>
                <p>
                  生肖马自身遇到马年，构成"<span className="text-[#8B5A2B] font-medium">午午自刑伏吟</span>"，
                  是典型的本命年现象，机遇与风险并存。生肖龙、牛则是相对中性的稳健年份。
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-[#1C1A16]/8">
                <p className="text-xs font-medium text-[#1C1A16]/50 mb-3">延伸阅读 · 命理知识</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: '刑冲会合', href: '/knowledge/xingchong' },
                    { name: '五行理论', href: '/knowledge/wuxing' },
                    { name: '十二地支', href: '/knowledge/dizhi' },
                    { name: '十天干', href: '/knowledge/tiangan' },
                    { name: '神煞大全', href: '/knowledge/shensha' },
                    { name: '大运理论', href: '/knowledge/dayun' },
                  ].map((t) => (
                    <Link key={t.href} href={t.href} className="text-xs px-3 py-1.5 rounded-full border border-[#1C1A16]/15 text-[#1C1A16]/60 hover:text-[#1C1A16] hover:border-[#1C1A16]/30 transition-colors">
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <Container>
          <Card
            hover={false}
            className="bg-gradient-to-br from-[#1C1A16] to-[#3A2F23] text-white border-0 shadow-xl text-center max-w-page mx-auto"
          >
            <h3 className="font-heading text-2xl sm:text-3xl mb-3">想看清2026年个人精准运势？</h3>
            <p className="text-sm text-white/75 mb-6 leading-relaxed">
              生肖只是宏观参考，真正决定个人运势的是完整八字（年月日时）。CyberFate 提供免费的八字详细分析，
              结合丙午年大势，给出针对你的具体行动建议。
            </p>
            <Link
              href="/bazi"
              className="inline-block bg-[#C8956C] hover:bg-[#B5825B] text-white px-8 py-3 rounded-full font-heading transition-colors"
            >
              免费做八字详细分析 →
            </Link>
          </Card>
        </Container>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <Container>
          <div className="max-w-page mx-auto">
            <h2 className="font-heading text-2xl text-[#1C1A16] mb-6 text-center">常见问题</h2>
            <div className="space-y-4">
              {faqItems.map((it) => (
                <Card key={it.question} hover={false} className="bg-white/90">
                  <h3 className="font-heading text-base text-[#1C1A16] mb-2">{it.question}</h3>
                  <p className="text-sm text-[#1C1A16]/70 leading-relaxed">{it.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

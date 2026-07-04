import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import {
  ArrowRight,
  BarChart3,
  BookHeart,
  BookOpen,
  Brain,
  Calendar,
  Compass,
  Layers,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '赛博命理师 CyberFate — AI 驱动的东方命理智慧',
  description: '免费在线命理分析平台，融合八字、紫微斗数、塔罗、六爻、梅花易数与现代 AI 技术。提供每日运势、生辰八字分析、合婚测算，科学理性的命理参考。',
  keywords: ['AI命理', '八字分析', '紫微斗数', '塔罗占卜', '六爻', '梅花易数', '每日运势', '免费算命', '命理分析', 'CyberFate', '赛博命理师'],
  alternates: { canonical: 'https://www.cyberfate.me' },
  openGraph: {
    title: '赛博命理师 CyberFate — AI 驱动的东方命理智慧',
    description: '免费在线命理分析平台，融合八字、紫微斗数、塔罗、六爻、梅花易数与现代 AI 技术。',
    type: 'website',
    url: 'https://www.cyberfate.me',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '赛博命理师 CyberFate',
  url: 'https://www.cyberfate.me',
  description: 'AI 驱动的东方命理智慧平台',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.cyberfate.me/knowledge?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const corePrinciples = [
  {
    icon: Brain,
    iconColor: 'text-pink-500',
    title: 'AI 智能科学解析',
    description: '融合知识图谱与多模态推理，让命理指标具备可验证的数据依据，帮助你读懂趋势背后的逻辑。',
  },
  {
    icon: BookOpen,
    iconColor: 'text-amber-600',
    title: '文化传承理性态度',
    description: '尊重东方传统语境，在现代语境下复原术语、拆解象征，建立科学、节制的参考框架。',
  },
  {
    icon: Compass,
    iconColor: 'text-indigo-500',
    title: '自主探索独立思考',
    description: '提供透明假设与多路径建议，辅助你结合经验与判断，自主设计可执行的行动方案。',
  },
];

const featureGroups = [
  {
    title: '八字分析',
    features: [
      {
        icon: BarChart3,
        iconColor: 'text-blue-500',
        title: '八字分析',
        subtitle: '输入生辰，AI 解读性格事业财运',
        description: 'AI智能八字分析系统，揭示个人命盘特质与发展规律',
        href: '/bazi',
      },
      {
        icon: Sun,
        iconColor: 'text-orange-400',
        title: '每日运势',
        subtitle: '今日五行宜忌 + 五维运势评分',
        description: '基于八字的每日运势分析，助你把握每日吉凶',
        href: '/daily',
      },
      {
        icon: BookHeart,
        iconColor: 'text-pink-500',
        title: '合婚配对',
        subtitle: '双方八字匹配度深度分析',
        description: '基于八字的深度匹配分析，揭示双方关系契合度',
        href: '/bazi/marriage',
      },
    ],
  },
  {
    title: '周易占卜',
    features: [
      {
        icon: Sparkles,
        iconColor: 'text-purple-500',
        title: '梅花易数',
        subtitle: '数字起卦，解读命盘方向',
        description: '基于梅花易数的每日决策指导，助你做出重要选择',
        href: '/meihua',
      },
      {
        icon: Layers,
        iconColor: 'text-indigo-400',
        title: '塔罗占卜',
        subtitle: '抽牌问卦，解读当下困惑',
        description: '塔罗牌参考配合AI观察，从不同角度思考当前处境',
        href: '/tarot',
      },
      {
        icon: Compass,
        iconColor: 'text-emerald-500',
        title: '六爻占卜',
        subtitle: '铜钱摇卦，解读卦象含义',
        description: '传统六爻解读，结合AI深度解析卦象变化',
        href: '/liuyao',
      },
    ],
  },
  {
    title: '更多工具',
    features: [
      {
        icon: Star,
        iconColor: 'text-yellow-500',
        title: '紫微斗数',
        subtitle: '十二宫位命盘全面解析',
        description: '根据出生时间排出紫微命盘，分析十二宫位与主星格局',
        href: '/ziwei',
      },
      {
        icon: Calendar,
        iconColor: 'text-red-400',
        title: '黄历查询',
        subtitle: '每日宜忌、吉时凶煞速查',
        description: '传统中国黄历，查询各类活动的吉日良辰',
        href: '/huangli',
      },
      {
        icon: BarChart3,
        iconColor: 'text-cyan-500',
        title: 'AI老黄历',
        subtitle: 'AI 智能黄历，场景化建议',
        description: 'AI驱动的智能黄历，结合现代生活场景给出建议',
        href: '/huangli',
      },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="relative bg-[#FAF9F6] min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%231C1A16' stroke-width='1'/%3E%3Cpath d='M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 5' fill='%231C1A16'/%3E%3Cpath d='M50 95 A45 45 0 0 1 50 5 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 95' fill='%23FFFFFF'/%3E%3Ccircle cx='50' cy='27' r='5' fill='%23FFFFFF' stroke='%231C1A16' stroke-width='1'/%3E%3Ccircle cx='50' cy='73' r='5' fill='%231C1A16'/%3E%3C/svg%3E\")",
          backgroundSize: '140px 140px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden px-4 pt-12 sm:pt-20 md:pt-28 lg:pt-40 pb-10 md:pb-14 lg:pb-16">
        <div className="relative z-10 max-w-page mx-auto text-center">
          {/* 主标题 */}
          <h1
            className="font-display text-[36px] sm:text-[48px] md:text-[56px] font-[800] text-[#1C1A16] leading-tight flex items-center justify-center gap-2"
            style={{ letterSpacing: '0.06em' }}
          >
            CYBERFATE
            <span className="sr-only">AI 八字命理 · 紫微斗数 · 塔罗占卜 · 每日运势分析</span>
          </h1>

          {/* 副标题 */}
          <p className="text-[17px] tracking-[0.05em] text-[#1C1A16]/70 text-center mt-6">
            AI 驱动的八字命理 · 紫微斗数 · 塔罗占卜 · 每日运势
          </p>

          {/* 按钮组 —— 用样式化 Link，避免 <a><button> 非法嵌套；主按钮走唯一强调色 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mt-10">
            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/bazi"
                className="inline-flex items-center justify-center min-h-[52px] rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors px-[40px] py-[15px] text-[17px] font-semibold tracking-[0.08em] shadow-sm"
              >
                八字分析 →
              </Link>
              <span className="text-[13px] text-brand-ink/45">生命密码解析</span>
            </div>

            {/* 竖直分隔线（仅桌面端横排时显示） */}
            <span aria-hidden className="hidden sm:block w-px h-12 bg-brand-ink/10" />

            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/meihua"
                className="inline-flex items-center justify-center min-h-[52px] rounded-lg bg-white text-brand-ink border border-brand-ink/30 hover:border-brand-ink hover:bg-[#FDFBF7] transition-colors px-[40px] py-[15px] text-[17px] font-semibold tracking-[0.08em]"
              >
                梅花易数 →
              </Link>
              <span className="text-[13px] text-brand-ink/45">智慧决策指南</span>
            </div>
          </div>

        </div>
      </section>

      {/* ===== 金句 ===== */}
      <section className="px-4 pt-2 md:pt-4 pb-12 md:pb-16">
        <Container>
          <figure className="relative max-w-page mx-auto rounded-2xl bg-[#F4F3F0] px-8 py-14 md:px-16 md:py-16 text-center overflow-hidden">
            <span aria-hidden className="absolute left-6 top-3 font-serif text-[72px] leading-none text-[#1C1A16]/10 select-none">&ldquo;</span>
            <blockquote className="relative font-display italic text-[22px] md:text-[30px] leading-[1.7] tracking-wide text-[#1C1A16]">
              除非你意识到你的潜意识，否则潜意识将主导你的人生，而你将其称为命运。
            </blockquote>
            <figcaption className="mt-7 text-sm text-[#1C1A16]/45 not-italic">— 卡尔·荣格</figcaption>
          </figure>
        </Container>
      </section>

      {/* ===== Core Principles 核心理念 ===== */}
      <section className="px-4 py-10 md:py-16 bg-brand-bg/60">
        <Container>
          <h2 className="text-center font-display text-[22px] md:text-[26px] text-[#1C1A16] mb-10 md:mb-12">核心理念</h2>
          <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {corePrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card
                  key={principle.title}
                  className="text-center border-none shadow-none p-8 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                  hover={false}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-[52px] h-[52px] rounded-full bg-brand-accent-soft flex items-center justify-center">
                      <Icon className="w-6 h-6 text-brand-accent" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[19px] font-semibold text-brand-ink mt-4">{principle.title}</h3>
                    <p className="text-sm text-brand-ink/70 mt-3 leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===== 功能展示区 ===== */}
      <section className="px-4 mt-16 md:mt-20 pb-28 md:pb-32">
        <Container>
          <div className="max-w-page mx-auto text-center">
            <h2 className="font-display text-[32px] text-[#1C1A16] mb-3">分析系统</h2>
            <p className="text-sm text-[#1C1A16]/70 mb-12">探索我们全面的智能分析服务</p>
          </div>

          <div className="max-w-page mx-auto space-y-16">
            {featureGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[18px] font-semibold text-[#1C1A16] mb-5">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={feature.title}
                        href={`${feature.href}?sidebar=open`}
                        className="group flex flex-col items-start rounded-card bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                      >
                        <div className="w-[52px] h-[52px] rounded-full bg-brand-accent-soft flex items-center justify-center">
                          <Icon className="w-6 h-6 text-brand-accent" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-lg font-semibold text-brand-ink mt-4 mb-1">{feature.title}</h4>
                        {'subtitle' in feature && feature.subtitle && (
                          <p className="text-[13px] text-brand-ink/55 mb-3">{feature.subtitle}</p>
                        )}
                        <p className="text-[14px] text-brand-ink/70 leading-relaxed flex-1">{feature.description}</p>
                        <span className="inline-flex items-center gap-1 text-[14px] text-brand-accent mt-4 transition-all duration-300 group-hover:gap-2">
                          进入分析
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===== 命理知识库 Section ===== */}
      <section className="px-4 pb-4">
        <Container>
          <div className="max-w-page mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-[32px] text-[#1C1A16] mb-3">命理知识库</h2>
              <p className="text-sm text-[#1C1A16]/70">从零读懂八字：五行、十神、大运背后的底层逻辑</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: '五行理论', desc: '金木水火土的生克框架', href: '/knowledge/wuxing' },
                { name: '十天干', desc: '甲乙丙丁……十干的含义', href: '/knowledge/tiangan' },
                { name: '十二地支', desc: '子丑寅卯的时空密码', href: '/knowledge/dizhi' },
                { name: '八字格局', desc: '格局定层次，命局高低', href: '/knowledge/geju' },
                { name: '大运理论', desc: '十年一运的起伏规律', href: '/knowledge/dayun' },
                { name: '神煞大全', desc: '吉神庇佑，凶煞警示', href: '/knowledge/shensha' },
              ].map((k) => (
                <Link
                  key={k.href}
                  href={k.href}
                  className="group rounded-xl border border-brand-ink/[0.08] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <p className="text-sm font-semibold text-brand-ink group-hover:text-brand-accent transition-colors">{k.name}</p>
                  <p className="text-xs text-brand-ink/55 mt-1 leading-relaxed">{k.desc}</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm text-[#1C1A16] transition-all duration-300 hover:gap-2">
                查看全部命理知识
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="px-4 pb-24">
        <Container>
          <div className="max-w-page mx-auto text-center py-16 px-10">
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-[#1C1A16]">
              AI 分析个人特质，洞察发展潜力
            </h2>
            <p className="text-base md:text-lg text-[#1C1A16]/70 mt-4 max-w-2xl mx-auto leading-relaxed">
              运用AI技术分析性格优势，为您的生涯规划提供科学参考
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link
                href="/bazi"
                className="inline-flex items-center justify-center min-h-[46px] px-[38px] py-[14px] text-[13px] tracking-[0.08em] bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors font-medium"
              >
                八字分析 →
              </Link>
              <Link
                href="/meihua"
                className="inline-flex items-center justify-center min-h-[46px] px-[38px] py-[14px] text-[13px] tracking-[0.08em] border border-brand-ink/30 text-brand-ink rounded-lg hover:border-brand-ink transition-colors"
              >
                梅花易数
              </Link>
            </div>
            <p className="text-[12px] text-brand-ink/55 tracking-[0.05em] mt-6">
              <span>⚡</span> 免费使用 <span>·</span> 无需注册 <span>·</span> 即刻体验
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

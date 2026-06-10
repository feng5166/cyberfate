import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    <div className="relative bg-[#FAF9F6] min-h-screen">
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
      <section className="relative overflow-hidden px-4 pt-30 md:pt-40 pb-16 md:pb-20">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* 主标题 */}
          <h1
            className="font-display text-[36px] sm:text-[48px] md:text-[56px] font-[800] text-[#1C1A16] leading-tight flex items-center justify-center gap-2"
            style={{ letterSpacing: '0.06em' }}
          >
            CYBERFATE
          </h1>

          {/* 副标题 */}
          <p className="text-[17px] tracking-[0.05em] text-[#1C1A16]/70 text-center mt-6">
            AI 驱动的八字命理、每日运势、塔罗占卜 —— 东方智慧，科学态度
          </p>

          {/* 信任锚点 */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[14px] text-[#1C1A16]/60 tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="text-[20px] font-semibold text-[#1C1A16]">10万+</span>
              <span>次分析</span>
            </span>
            <span className="text-[#1C1A16]/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[20px] font-semibold text-[#1C1A16]">5万+</span>
              <span>用户</span>
            </span>
            <span className="text-[#1C1A16]/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[15px] font-medium text-[#1C1A16]">AI + 传统命理</span>
              <span>双引擎</span>
            </span>
          </div>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link href="/bazi">
              <Button
                variant="primary"
                size="lg"
                className="px-[38px] py-[14px] text-[13px] tracking-[0.08em]"
              >
                免费开始解析 →
              </Button>
            </Link>
            <Link href="/meihua">
              <Button
                variant="secondary"
                size="lg"
                className="px-[38px] py-[14px] text-[13px] tracking-[0.08em] !text-[#1C1A16] !border-[#1C1A16]/30 hover:!border-[#1C1A16] hover:!bg-[#FDFBF7]"
              >
                梅花易数
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-[15px] text-[#1C1A16]/70 text-center max-w-2xl mx-auto leading-relaxed">
            赛博命理师结合 AI 智能科学解析传统命理，为你提供八字、紫微、塔罗等全方位命理分析服务
          </p>

          {/* 金句引用 */}
          <blockquote className="mt-8 md:mt-10 max-w-[480px] mx-auto">
            <p className="text-[14px] text-[#1C1A16]/50 leading-relaxed text-center italic">
              &ldquo;When the inner situation is not made conscious, it happens outside, as fate.&rdquo;
            </p>
            <cite className="text-[12px] text-[#1C1A16]/45 mt-2 block text-center not-italic">
              — C.G. Jung
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ===== 新手推荐路径 ===== */}
      <section className="px-4 py-10 md:py-14">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-[14px] text-[#1C1A16]/50 tracking-wide mb-6">
              新手推荐路径
            </h2>
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              {[
                {
                  step: '第一步',
                  title: '测测你的八字',
                  desc: '输入生辰，了解你的命盘特质',
                  href: '/bazi',
                  icon: BarChart3,
                  iconColor: 'text-blue-500',
                },
                {
                  step: '第二步',
                  title: '看今日运势',
                  desc: '掌握每日五行宜忌与运势评分',
                  href: '/daily',
                  icon: Sun,
                  iconColor: 'text-orange-400',
                },
                {
                  step: '第三步',
                  title: '探索更多功能',
                  desc: '梅花易数、塔罗占卜、紫微斗数',
                  href: '#features',
                  icon: Sparkles,
                  iconColor: 'text-purple-500',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-center gap-4 flex-1">
                    <Link href={item.href} className="flex-1">
                      <Card
                        hover={false}
                        className="text-center p-6 border-none shadow-none hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] text-[#1C1A16]/40 tracking-widest uppercase mb-2">{item.step}</span>
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-[15px] font-semibold text-[#1C1A16]">{item.title}</h3>
                          <p className="text-[12px] text-[#1C1A16]/50 mt-1.5">{item.desc}</p>
                        </div>
                      </Card>
                    </Link>
                    {i < 2 && (
                      <ArrowRight className="w-4 h-4 text-[#1C1A16]/20 flex-shrink-0 hidden md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ===== Core Principles ===== */}
      <section className="px-4 py-10 md:py-16 bg-brand-bg/60">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {corePrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card
                  key={principle.title}
                  className="text-center border-none shadow-none p-8 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                  hover={false}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${principle.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[19px] font-semibold text-[#1C1A16] mt-4">{principle.title}</h3>
                    <p className="text-sm text-[#1C1A16]/70 mt-3 leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===== Social Proof ===== */}
      <section className="px-4 py-6 overflow-hidden">
        <Container>
          <div className="text-center mb-4">
            <p className="text-[14px] text-[#1C1A16]/60 tracking-wide">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span className="text-[18px] font-semibold text-[#1C1A16]">1,234</span> 人今日已分析
            </p>
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="flex gap-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex gap-4 animate-[scroll_30s_linear_infinite]">
                {[
                  { text: '八字分析很准，对我的事业方向有了新的认识', author: '张先生', tag: '八字分析' },
                  { text: '每日运势很实用，每天早上都会看一看', author: '李女士', tag: '每日运势' },
                  { text: '合婚分析给了我们很好的参考，非常详细', author: '王先生', tag: '合婚配对' },
                  { text: '梅花易数的解读角度很独特，值得一试', author: '赵女士', tag: '梅花易数' },
                  { text: 'AI解读比传统命理师更客观，推荐！', author: '刘先生', tag: '八字分析' },
                  { text: '紫微斗数分析很详细，十二宫位都有解读', author: '陈女士', tag: '紫微斗数' },
                ].flatMap((review, i) => [review, review].map((r, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="flex-shrink-0 w-[260px] bg-white/80 backdrop-blur-sm rounded-xl border border-[#1C1A16]/[0.06] p-4"
                  >
                    <p className="text-[13px] text-[#1C1A16]/70 leading-relaxed line-clamp-2">&ldquo;{r.text}&rdquo;</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[12px] text-[#1C1A16]/50">{r.author}</span>
                      <span className="text-[11px] text-[#1C1A16]/40 bg-[#1C1A16]/[0.04] px-2 py-0.5 rounded-full">{r.tag}</span>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== 功能展示区 ===== */}
      <section className="px-4 mt-32 md:mt-36 pb-28 md:pb-32">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-[32px] text-[#1C1A16] mb-3">分析系统</h2>
            <p className="text-sm text-[#1C1A16]/70 mb-12">探索我们全面的智能分析服务</p>
          </div>

          <div className="space-y-16">
            {featureGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[18px] font-semibold text-[#1C1A16] mb-5">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Card
                        key={feature.title}
                        hover={false}
                        className="group flex flex-col items-start p-8 border-none shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                      >
                        <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center">
                          <Icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-lg font-semibold text-[#1C1A16] mt-4 mb-1">{feature.title}</h4>
                        {'subtitle' in feature && feature.subtitle && (
                          <p className="text-[13px] text-[#1C1A16]/50 mb-3">{feature.subtitle}</p>
                        )}
                        <p className="text-[14px] text-[#1C1A16]/70 leading-relaxed flex-1">{feature.description}</p>
                        <Link
                          href={`${feature.href}?sidebar=open`}
                          className="inline-flex items-center gap-1 text-[14px] text-[#1C1A16] mt-4 transition-all duration-300 group-hover:gap-2"
                        >
                          进入分析
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="px-4 pb-24">
        <Container>
          <div className="text-center py-16 px-10">
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-[#1C1A16]">
              AI 分析个人特质，洞察发展潜力
            </h2>
            <p className="text-base md:text-lg text-[#1C1A16]/70 mt-4 max-w-2xl mx-auto leading-relaxed">
              运用AI技术分析性格优势，为您的生涯规划提供科学参考
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link href="/bazi">
                <button className="px-[38px] py-[14px] text-[13px] tracking-[0.08em] bg-[#1C1A16] text-white rounded-lg hover:bg-[#2C2924] transition-colors font-medium">
                  免费开始解析 →
                </button>
              </Link>
              <Link href="/meihua">
                <button className="px-[38px] py-[14px] text-[13px] tracking-[0.08em] border border-[#1C1A16]/30 text-[#1C1A16] rounded-lg hover:border-[#1C1A16] transition-colors">
                  梅花易数
                </button>
              </Link>
            </div>
            <p className="text-[12px] text-[#1C1A16]/55 tracking-[0.05em] mt-6">
              <span>⚡</span> 免费使用 <span>·</span> 无需注册 <span>·</span> 即刻体验
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

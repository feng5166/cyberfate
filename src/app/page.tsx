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

const corePrinciples = [
  {
    icon: Brain,
    title: 'AI 智能科学解析',
    description: '融合知识图谱与多模态推理，让命理指标具备可验证的数据依据，帮助你读懂趋势背后的逻辑。',
  },
  {
    icon: BookOpen,
    title: '文化传承理性态度',
    description: '尊重东方传统语境，在现代语境下复原术语、拆解象征，建立科学、节制的参考框架。',
  },
  {
    icon: Compass,
    title: '自主探索独立思考',
    description: '提供透明假设与多路径建议，辅助你结合经验与判断，自主设计可执行的行动方案。',
  },
];

const featureGroups = [
  {
    title: '八字算命',
    features: [
      {
        icon: BarChart3,
        title: '命盘解析',
        description: '生成四柱命盘，AI 解释十神、用神与大运，明确优势与短板。',
        href: '/bazi',
      },
      {
        icon: Sun,
        title: '每日运势',
        description: '结合日柱五行与节气，推送当日宜忌与行动建议。',
        href: '/daily',
      },
      {
        icon: BookHeart,
        title: '合婚分析',
        description: '对比双方命盘能量，评估关系协同性与潜在风险点。',
        href: '/bazi/marriage',
      },
    ],
  },
  {
    title: '周易占卜',
    features: [
      {
        icon: Sparkles,
        title: '梅花易数',
        description: '起卦到断卦全流程 AI 协助，快速洞察局势吉凶。',
        href: '/meihua',
      },
      {
        icon: Layers,
        title: '塔罗解读',
        description: '精选牌阵 + 语义分析，提供多视角心灵洞察。',
        href: '/tarot',
      },
      {
        icon: Compass,
        title: '六爻占卜',
        description: '以象数推演进展节点，临时入口复用梅花易数。',
        href: '/meihua',
      },
    ],
  },
  {
    title: '更多工具',
    features: [
      {
        icon: Star,
        title: '紫微排盘',
        description: '自动排盘十二宫位，标注重点星曜与宫干。',
        href: '/ziwei',
      },
      {
        icon: Calendar,
        title: '黄历查询',
        description: '传统黄历宜忌配合智能择日，实时同步节气。',
        href: '/huangli',
      },
      {
        icon: BarChart3,
        title: 'AI 黄历',
        description: '结合个体命盘偏好，输出个性化的每日节奏建议。',
        href: '/huangli',
      },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden px-4 pt-24 md:pt-32 pb-24 md:pb-28">
        {/* 太极图背景装饰 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23888' stroke-width='0.5'/%3E%3Cpath d='M50 10 A40 40 0 0 1 50 90 A20 20 0 0 0 50 50 A20 20 0 0 1 50 10' fill='%23888'/%3E%3Cpath d='M50 90 A40 40 0 0 1 50 10 A20 20 0 0 0 50 50 A20 20 0 0 1 50 90' fill='white'/%3E%3Ccircle cx='50' cy='30' r='5' fill='%23888'/%3E%3Ccircle cx='50' cy='70' r='5' fill='white'/%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* 主标题 */}
          <h1 className="font-display text-[44px] sm:text-[52px] md:text-[56px] font-normal text-brand-black tracking-[0.12em] sm:tracking-[0.15em] text-center leading-tight">
            CYBERFATE
          </h1>

          {/* 副标题 */}
          <p className="text-[18px] text-brand-gray text-center mt-6">
            解码命运 · 智见未来
          </p>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link href="/bazi">
              <Button
                variant="primary"
                size="lg"
                className="px-12 py-[14px] text-base tracking-[0.08em]"
              >
                开始分析
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="secondary"
                size="lg"
                className="px-12 py-[14px] text-base tracking-[0.08em]"
              >
                了解更多
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-base text-brand-light text-center max-w-2xl mx-auto leading-relaxed">
            赛博命理师结合 AI 智能科学解析传统命理，为你提供八字、紫微、塔罗等全方位命理分析服务
          </p>

          {/* 金句引用 */}
          <blockquote className="mt-16 md:mt-20 max-w-[480px] mx-auto">
            <p className="text-[14px] text-brand-light leading-relaxed text-center italic">
              &ldquo;When the inner situation is not made conscious, it happens outside, as fate.&rdquo;
            </p>
            <cite className="text-[12px] text-brand-light/70 mt-2 block text-center not-italic">
              — C.G. Jung
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ===== Core Principles ===== */}
      <section className="px-4 py-20 md:py-24 bg-brand-bg/60">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {corePrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card key={principle.title} className="text-center" hover={false}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-brand-black opacity-75" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-black mt-4">{principle.title}</h3>
                    <p className="text-sm text-brand-gray mt-3 leading-relaxed">
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
      <section className="px-4 mt-32 md:mt-36 pb-28 md:pb-32">
        <Container className="space-y-14">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-brand-black">{group.title}</h2>
                <div className="h-px flex-1 ml-6 bg-brand-border-light" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} className="group flex flex-col">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100">
                          <Icon className="w-8 h-8 text-brand-black opacity-75" strokeWidth={1.4} />
                        </div>
                        <div>
                          <p className="text-xs text-brand-light">{group.title}</p>
                          <h3 className="text-lg font-medium text-brand-black mt-1">{feature.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-brand-gray mt-3 flex-1 leading-relaxed">{feature.description}</p>
                      <Link
                        href={feature.href}
                        className="inline-flex items-center gap-1 text-sm mt-4 text-brand-black group-hover:gap-2 transition-all duration-200"
                      >
                        进入分析
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="px-4 pb-24">
        <Container>
          <Card className="bg-brand-black text-white text-center py-16 px-10" hover={false}>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">
              AI 分析个人特质，洞察发展潜力
            </h2>
            <p className="text-base md:text-lg text-white/80 mt-4 max-w-2xl mx-auto">
              融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link href="/bazi">
                <Button variant="primary" className="bg-white text-brand-black hover:bg-white/90">
                  免费开始
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" className="border-white text-white hover:bg-white/10">
                  查看定价
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/60 mt-6">
              免费使用 · 无需注册 · 即刻体验
            </p>
          </Card>
        </Container>
      </section>
    </div>
  );
}

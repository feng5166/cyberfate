import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Star, Sparkles, Layers, Calendar, BookOpen, Bot, Microscope, Gift, Brain, BookHeart, Compass } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: '八字分析',
    description: '根据出生时间计算四柱八字，AI 深度解读命理',
    href: '/bazi',
    available: true,
  },
  {
    icon: Star,
    title: '紫微斗数',
    description: '紫微排盘，解析命宫十二宫位',
    href: '/ziwei',
    available: false,
  },
  {
    icon: Sparkles,
    title: '周易占卜',
    description: '梅花易数、六爻预测，问事解惑',
    href: '/meihua',
    available: false,
  },
  {
    icon: Layers,
    title: '塔罗牌',
    description: '经典韦特塔罗，AI 智能解读牌阵',
    href: '/tarot',
    available: false,
  },
  {
    icon: BookOpen,
    title: '每日运势',
    description: '基于八字的个性化每日运势分析',
    href: '/daily',
    available: true,
  },
  {
    icon: Calendar,
    title: 'AI 黄历',
    description: '宜忌查询，智能择日建议',
    href: '/huangli',
    available: false,
  },
];

const coreValues = [
  {
    icon: Brain,
    title: 'AI 智能，科学解析',
    description: '融合现代 AI 技术与传统命理智慧，通过大数据分析和机器学习，提供客观的命理解读，让玄学不再玄',
  },
  {
    icon: BookHeart,
    title: '文化传承，理性态度',
    description: '以开放理性的态度传承东方智慧，去芜存菁，不迷信、不神化，让千年命理文化以更健康的方式融入现代生活',
  },
  {
    icon: Compass,
    title: '自主探索，独立思考',
    description: '我们相信每个人都是自己命运的解读者。通过 AI 工具赋能，让每个人都能独立进行命理分析，自主思考人生方向，让每一个选择都源于内心的觉察与智慧',
  },
];

const highlights = [
  {
    icon: Bot,
    title: 'AI 智能解读',
    description: '融合传统命理知识与现代 AI 技术，提供深度、个性化的命理分析',
  },
  {
    icon: Microscope,
    title: '科学理性',
    description: '以科学态度对待传统文化，仅供参考，不做迷信宣传',
  },
  {
    icon: Gift,
    title: '免费使用',
    description: '核心功能完全免费，让传统文化触手可及',
  },
];

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-20 bg-background-alt">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6 text-primary">
            赛博命理师
          </h1>
          <p className="text-xl sm:text-2xl text-secondary mb-4">
            AI 驱动的东方智慧分析系统
          </p>
          <p className="text-muted max-w-2xl mx-auto mb-8">
            融合传统命理与现代人工智能，为你提供科学、理性的命理分析参考
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bazi">
              <Button size="lg">开始探索</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">了解更多</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="px-4 py-16 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-lg sm:text-xl text-primary font-serif leading-[1.7] mb-6 max-w-xl mx-auto">
            除非你意识到你的潜意识，否则潜意识将主导你的人生，而你将其称为命运。
          </blockquote>
          <cite className="text-muted text-base">— 卡尔·荣格</cite>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="px-4 py-16 bg-background-alt">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12 text-primary">
            核心理念
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {coreValues.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/20 mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-primary">{value.title}</h3>
                  <p className="text-secondary text-sm leading-[1.7]">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12 text-primary">
            功能服务
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  hover={feature.available}
                  className="relative"
                >
                  {!feature.available && (
                    <div className="absolute top-4 right-4 text-xs text-muted bg-background-alt px-2 py-1 rounded">
                      即将上线
                    </div>
                  )}
                  <Icon className="w-8 h-8 mb-4 text-primary" strokeWidth={2} />
                  <h3 className="text-lg font-semibold mb-2 text-primary">{feature.title}</h3>
                  <p className="text-secondary text-sm mb-4">{feature.description}</p>
                  {feature.available ? (
                    <Link href={feature.href}>
                      <Button variant="secondary" size="sm" className="w-full">
                        立即体验
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full" disabled>
                      敬请期待
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="px-4 py-16 bg-background-alt">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12 text-primary">
            产品特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-4 text-primary" strokeWidth={2} />
                  <h3 className="text-lg font-semibold mb-2 text-primary">{item.title}</h3>
                  <p className="text-secondary text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4 text-primary">
            开始你的命理探索之旅
          </h2>
          <p className="text-secondary mb-8 max-w-2xl mx-auto">
            立即体验 AI 驱动的命理分析服务
          </p>
          <Link href="/bazi">
            <Button size="lg">免费开始</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: '🔮',
    title: '八字算命',
    description: '根据出生时间计算四柱八字，AI 深度解读命理',
    href: '/bazi',
    available: true,
  },
  {
    icon: '⭐',
    title: '紫微斗数',
    description: '紫微排盘，解析命宫十二宫位',
    href: '/ziwei',
    available: false,
  },
  {
    icon: '☯️',
    title: '周易占卜',
    description: '梅花易数、六爻预测，问事解惑',
    href: '/meihua',
    available: false,
  },
  {
    icon: '🃏',
    title: '塔罗牌',
    description: '经典韦特塔罗，AI 智能解读牌阵',
    href: '/tarot',
    available: false,
  },
  {
    icon: '📅',
    title: '每日运势',
    description: '基于八字的个性化每日运势分析',
    href: '/daily',
    available: true,
  },
  {
    icon: '📜',
    title: 'AI 黄历',
    description: '宜忌查询，智能择日建议',
    href: '/huangli',
    available: false,
  },
];

const highlights = [
  {
    icon: '🤖',
    title: 'AI 智能解读',
    description: '融合传统命理知识与现代 AI 技术，提供深度、个性化的命理分析',
  },
  {
    icon: '🔬',
    title: '科学理性',
    description: '以科学态度对待传统文化，仅供参考，不做迷信宣传',
  },
  {
    icon: '🆓',
    title: '免费使用',
    description: '核心功能完全免费，让传统文化触手可及',
  },
];

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:py-32 bg-background-alt">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-6xl font-bold mb-6 text-primary">
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

      {/* Features Section */}
      <section id="features" className="px-4 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12 text-primary">
            功能服务
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
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
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-primary">{feature.title}</h3>
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
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="px-4 py-16 sm:py-24 bg-background-alt">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12 text-primary">
            产品特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-primary">{item.title}</h3>
                <p className="text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6 text-primary">
            开始你的命理探索之旅
          </h2>
          <p className="text-secondary mb-8 max-w-2xl mx-auto">
            无需注册，立即体验 AI 驱动的命理分析服务
          </p>
          <Link href="/bazi">
            <Button size="lg">免费开始</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

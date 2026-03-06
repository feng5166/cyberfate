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
    <div className="bg-gradient-cyber min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-6xl font-bold mb-6">
            <span className="text-cyber-gold">赛博命理师</span>
          </h1>
          <p className="text-xl sm:text-2xl text-text-secondary mb-4">
            CyberFate - AI 驱动的东方智慧
          </p>
          <p className="text-text-muted max-w-2xl mx-auto mb-8">
            融合传统命理与现代人工智能，为你提供科学、理性的命理分析参考。
            探索八字、紫微、周易、塔罗的奥秘。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bazi">
              <Button size="lg">
                开始算命 →
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
        
        {/* 装饰元素 */}
        <div className="absolute top-1/4 left-10 text-6xl opacity-10 animate-pulse">☯️</div>
        <div className="absolute bottom-1/4 right-10 text-6xl opacity-10 animate-pulse">🔮</div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4 text-cyber-gold">
            探索命理奥秘
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
            多种传统命理工具，AI 智能解读，让古老智慧焕发新生
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link 
                key={feature.title}
                href={feature.available ? feature.href : '#'}
                className={feature.available ? '' : 'cursor-not-allowed'}
              >
                <Card hover={feature.available} className="h-full">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-heading text-lg font-semibold mb-2 text-text-primary">
                    {feature.title}
                    {!feature.available && (
                      <span className="ml-2 text-xs text-text-muted font-normal">
                        (即将上线)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {feature.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="px-4 py-16 sm:py-24 bg-cyber-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4 text-cyber-gold">
            为什么选择赛博命理师
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
            现代科技与传统文化的完美结合
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-heading text-xl font-semibold mb-2 text-text-primary">
                  {item.title}
                </h3>
                <p className="text-text-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4 text-cyber-gold">
            开始探索你的命运
          </h2>
          <p className="text-text-muted mb-8">
            输入你的出生时间，AI 将为你揭示命理的奥秘
          </p>
          <Link href="/bazi">
            <Button size="lg" className="glow-gold">
              🔮 免费测算八字
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

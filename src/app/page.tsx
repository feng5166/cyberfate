import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import {
  BarChart3, Star, Sparkles, Layers, Calendar,
  BookHeart, Sun, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: '八字分析',
    description: '根据出生时间计算四柱八字，AI 深度解读命盘',
    href: '/bazi',
  },
  {
    icon: BookHeart,
    title: '八字合婚',
    description: '测算双方八字匹配度，了解婚姻运势',
    href: '/bazi/marriage',
  },
  {
    icon: Star,
    title: '紫微斗数',
    description: '紫微排盘，解析命宫十二宫位',
    href: '/ziwei',
  },
  {
    icon: Sparkles,
    title: '梅花易数',
    description: '快速起卦，洞察吉凶',
    href: '/meihua',
  },
  {
    icon: Layers,
    title: '塔罗占卜',
    description: '经典韦特塔罗，AI 智能解读牌阵',
    href: '/tarot',
  },
  {
    icon: Calendar,
    title: 'AI 黄历',
    description: '宜忌查询，智能择日建议',
    href: '/huangli',
  },
  {
    icon: Sun,
    title: '每日运势',
    description: '查看今日五行运势、宜忌指南',
    href: '/daily',
  },
];

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden px-4 pt-20 md:pt-26 pb-16 md:pb-22">
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
              <Button variant="primary" size="lg">开始分析</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">了解更多</Button>
            </Link>
          </div>

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

      {/* ===== 功能展示区 ===== */}
      <section className="px-4 mt-24 md:mt-30 pb-20 md:pb-26">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="group flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-bg flex-shrink-0">
                      <Icon className="w-5 h-5 text-brand-black" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-lg font-medium text-brand-black">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-brand-gray mt-2 flex-1">{feature.description}</p>
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
        </Container>
      </section>

      {/* ===== Footer ===== */}
      <Footer />
    </div>
  );
}

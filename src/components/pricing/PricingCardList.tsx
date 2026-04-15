'use client';

import { PricingCard } from './PricingCard';

export const PRICING_PLANS = [
  {
    name: '基础版',
    price: '5',
    period: '/ 月',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '标准客服支持'],
  },
  {
    name: '专业版',
    price: '6',
    period: '/ 季',
    recommended: true,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '优先客服支持', '紫微斗数', '周易占卜（梅花易数）'],
  },
  {
    name: '尊享版',
    price: '7',
    period: '/ 年',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '专属客服支持', '紫微斗数', '周易占卜（梅花易数）', '塔罗占卜', '新功能优先体验'],
  },
];

interface PricingCardListProps {
  selectedPlan: string;
  onSelectPlan: (name: string) => void;
  onCTAClick: (planName: string, price: string) => void;
  isSubscribed?: boolean;
  currentPlan?: string;
}

export function PricingCardList({
  selectedPlan,
  onSelectPlan,
  onCTAClick,
  isSubscribed = false,
  currentPlan,
}: PricingCardListProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      {PRICING_PLANS.map((plan) => {
        const isCurrent = isSubscribed && currentPlan === plan.name;
        return (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.price}
            period={plan.period}
            recommended={plan.recommended}
            perks={plan.perks}
            isSelected={!isCurrent && selectedPlan === plan.name}
            isCurrentPlan={isCurrent}
            isSubscribed={isSubscribed}
            ctaText={isCurrent ? '当前计划' : isSubscribed ? '管理订阅 →' : undefined}
            onClick={() => onSelectPlan(plan.name)}
            onCTAClick={() => onCTAClick(plan.name, plan.price)}
          />
        );
      })}
    </div>
  );
}

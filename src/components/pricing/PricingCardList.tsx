'use client';

import { PricingCard } from './PricingCard';
import { PRICING_PLANS_LIST } from '@/lib/pricing-config';

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
      {PRICING_PLANS_LIST.map((plan) => {
        const isCurrent = isSubscribed && currentPlan === plan.name;
        return (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.displayPrice}
            period={plan.periodLabel}
            recommended={plan.recommended}
            perks={plan.perks}
            isSelected={!isCurrent && selectedPlan === plan.name}
            isCurrentPlan={isCurrent}
            isSubscribed={isSubscribed}
            ctaText={isCurrent ? '当前计划' : isSubscribed ? '管理订阅 →' : undefined}
            onClick={() => onSelectPlan(plan.name)}
            onCTAClick={() => onCTAClick(plan.name, plan.displayPrice)}
          />
        );
      })}
    </div>
  );
}

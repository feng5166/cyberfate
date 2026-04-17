'use client';

import { PricingCard } from './PricingCard';
import { PRICING_PLANS_LIST } from '@/lib/pricing-config';

const CURRENCY_SYMBOLS: Record<string, string> = { usd: '$', cny: '¥' };

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
            key={plan.id}
            name={plan.name}
            price={plan.displayPrice}
            period={plan.periodLabel}
            recommended={plan.recommended}
            perks={plan.perks}
            isSelected={!isCurrent && selectedPlan === plan.id}
            isCurrentPlan={isCurrent}
            isSubscribed={isSubscribed}
            ctaText={isCurrent ? '当前计划' : isSubscribed ? '管理订阅 →' : undefined}
            currencySymbol={CURRENCY_SYMBOLS[plan.currency] || '$'}
            onClick={() => onSelectPlan(plan.id)}
            onCTAClick={() => onCTAClick(plan.id, plan.displayPrice)}
          />
        );
      })}
    </div>
  );
}

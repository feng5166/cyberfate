'use client';

import { PricingCard } from './PricingCard';
import { SELLABLE_PLANS_LIST, CURRENCY_SYMBOLS } from '@/lib/pricing-config';

interface PricingCardListProps {
  selectedPlan: string;
  onSelectPlan: (id: string) => void;
  onCTAClick: (planId: string, price: string) => void;
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
    <div className="flex flex-col gap-6">
      {SELLABLE_PLANS_LIST.map((plan) => {
        const isCurrent = isSubscribed && currentPlan === plan.id;
        return (
          <PricingCard
            key={plan.id}
            plan={plan}
            currencySymbol={CURRENCY_SYMBOLS[plan.currency] || '$'}
            isSelected={!isCurrent && selectedPlan === plan.id}
            isCurrentPlan={isCurrent}
            isSubscribed={isSubscribed}
            ctaText={isCurrent ? '当前计划' : isSubscribed ? '管理订阅 →' : undefined}
            onClick={() => onSelectPlan(plan.id)}
            onCTAClick={() => onCTAClick(plan.id, plan.displayPrice)}
          />
        );
      })}
    </div>
  );
}

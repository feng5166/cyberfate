'use client';

import { PRICING_PLANS_LIST, SELLABLE_PLANS_LIST } from '@/lib/pricing-config';

interface PlanSwitcherProps {
  currentPlan: string;
  onPlanChange: (newPlan: string, isUpgrade: boolean) => void;
}

export function PlanSwitcher({ currentPlan, onPlanChange }: PlanSwitcherProps) {
  // 当前套餐金额从全量列表取(含存量 lifetime),用于判断升降级;但只展示可售两档
  const currentPlanData = PRICING_PLANS_LIST.find(p => p.id === currentPlan);
  const currentAmount = currentPlanData?.amount || 0;

  return (
    <div>
      <h4 className="text-sm font-semibold text-[#1C1A16] mb-4">变更套餐</h4>
      <div className="grid grid-cols-2 gap-3">
        {SELLABLE_PLANS_LIST.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = plan.amount > currentAmount;
          const isDowngrade = plan.amount < currentAmount;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 text-center ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[#E5E2DD] hover:border-[#1C1A16]/30'
              }`}
            >
              <div className="text-sm font-semibold text-[#1C1A16] mb-1">
                {plan.name}
              </div>
              {isCurrent && (
                <div className="text-xs text-emerald-600 font-medium mb-2">★ 当前</div>
              )}
              <div className="text-lg font-bold text-[#1C1A16] mb-1">
                ${plan.displayPrice}
                {plan.originalDisplayPrice && (
                  <span className="text-xs font-normal text-[#1C1A16]/35 line-through ml-1">${plan.originalDisplayPrice}</span>
                )}
              </div>
              <div className="text-xs text-[#1C1A16]/50 mb-3">/{plan.period}</div>
              
              {!isCurrent && isUpgrade && (
                <button
                  onClick={() => onPlanChange(plan.id, isUpgrade)}
                  className="w-full text-xs py-2 rounded bg-[#1C1A16] text-white hover:bg-[#2A2621] transition-colors"
                >
                  升级 →
                </button>
              )}
              {!isCurrent && isDowngrade && (
                <div className="text-xs text-[#1C1A16]/40 text-center py-2">
                  —
                </div>
              )}
              {isCurrent && (
                <div className="text-xs text-emerald-600 font-medium">当前计划</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
}

const PLANS: Plan[] = [
  { id: 'monthly', name: '基础版', price: 29, period: '月' },
  { id: 'quarterly', name: '专业版', price: 68, period: '季' },
  { id: 'yearly', name: '尊享版', price: 238, period: '年' },
];

interface PlanSwitcherProps {
  currentPlan: string;
  onPlanChange: (newPlan: string, isUpgrade: boolean) => void;
}

export function PlanSwitcher({ currentPlan, onPlanChange }: PlanSwitcherProps) {
  const currentPlanData = PLANS.find(p => p.id === currentPlan);
  const currentPrice = currentPlanData?.price || 0;

  return (
    <div>
      <h4 className="text-sm font-semibold text-[#1C1A16] mb-4">变更套餐</h4>
      <div className="grid grid-cols-3 gap-3">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = plan.price > currentPrice;
          const isDowngrade = plan.price < currentPrice;

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
              <div className="text-lg font-bold text-[#1C1A16] mb-1">¥{plan.price}</div>
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

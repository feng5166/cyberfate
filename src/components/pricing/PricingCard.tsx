'use client';

import { Check, Info, BadgeCheck } from 'lucide-react';
import type { PlanConfig } from '@/lib/pricing-config';

export interface PricingCardProps {
  plan: PlanConfig;
  currencySymbol?: string;
  isSelected: boolean;
  isCurrentPlan?: boolean;
  isSubscribed?: boolean;
  ctaText?: string;        // 覆盖默认按钮文案（如"当前计划""管理订阅"）
  onClick: () => void;
  onCTAClick: () => void;
}

export function PricingCard({
  plan,
  currencySymbol = '$',
  isSelected,
  isCurrentPlan = false,
  isSubscribed = false,
  ctaText,
  onClick,
  onCTAClick,
}: PricingCardProps) {
  const highlighted = plan.recommended;
  const buttonLabel = ctaText ?? plan.ctaText;

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      {/* 角标：早鸟优惠 */}
      {plan.badge && !isCurrentPlan && (
        <div className="absolute top-0 right-0 z-10">
          <span className="inline-block bg-[#1C1A16] text-white text-xs px-3.5 py-1.5 rounded-tr-2xl rounded-bl-2xl font-medium">
            {plan.badge}
          </span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 z-10">
          <span className="inline-block bg-emerald-600 text-white text-xs px-3.5 py-1.5 rounded-tr-2xl rounded-bl-2xl font-medium">
            ✓ 当前计划
          </span>
        </div>
      )}

      <div
        className={`flex flex-col p-6 md:p-9 bg-white rounded-2xl transition-all duration-300 ${
          isCurrentPlan
            ? 'ring-2 ring-emerald-500 shadow-md'
            : isSelected
              ? 'ring-2 ring-[#1C1A16] shadow-md'
              : highlighted
                ? 'ring-1 ring-[#1C1A16]/30 shadow-sm hover:shadow-md'
                : 'ring-1 ring-[#1C1A16]/10 shadow-sm hover:shadow-md'
        }`}
      >
        {/* 标题 + 副标题 */}
        <h2 className="text-[22px] font-semibold text-[#1C1A16]">
          {highlighted ? (
            <span className="bg-[#E8EDFB] px-1.5 rounded">{plan.name}</span>
          ) : (
            plan.name
          )}
        </h2>
        <p className="text-sm text-[#1C1A16]/50 mt-1.5">{plan.subtitle}</p>

        {/* 价格 */}
        <div className="flex items-end gap-2 mt-5">
          <div className="flex items-end">
            <span className="text-[34px] font-bold leading-none text-[#1C1A16]">{currencySymbol}</span>
            <span className="text-[34px] font-bold leading-none text-[#1C1A16]">{plan.displayPrice}</span>
          </div>
          <span className="text-sm text-[#1C1A16]/55 pb-0.5">{plan.periodLabel}</span>
          {plan.originalDisplayPrice && (
            <span className="text-sm text-[#1C1A16]/35 line-through pb-0.5 ml-1">
              原价 {currencySymbol}{plan.originalDisplayPrice}{plan.periodLabel}
            </span>
          )}
        </div>

        {/* 价格锁定提示 banner */}
        {plan.lockPriceNote && (
          <div className="flex items-start gap-2.5 mt-5 bg-[#F4F4F2] rounded-xl px-4 py-3">
            <BadgeCheck className="w-5 h-5 text-[#1C1A16] mt-px shrink-0" strokeWidth={2} />
            <p className="text-sm text-[#1C1A16]/80 leading-relaxed">{plan.lockPriceNote}</p>
          </div>
        )}

        {/* 权益 */}
        <p className="text-sm text-[#1C1A16]/45 mt-6 mb-3">{plan.perksTitle}</p>
        <ul className="space-y-2.5">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-sm text-[#1C1A16]/85">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
              {perk}
            </li>
          ))}
        </ul>

        {/* 适合人群 */}
        {plan.audience.length > 0 && (
          <>
            <p className="text-sm text-[#1C1A16]/45 mt-6 mb-3">{plan.audienceTitle}</p>
            <ul className="space-y-2.5">
              {plan.audience.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#1C1A16]/70">
                  <Info className="w-4 h-4 text-[#1C1A16]/35 mt-0.5 shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isCurrentPlan) onCTAClick();
          }}
          disabled={isCurrentPlan}
          className={`w-full h-12 rounded-lg text-sm font-medium transition-colors mt-7 ${
            isCurrentPlan
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : highlighted && !isSubscribed
                ? 'bg-[#1C1A16] text-white hover:bg-[#2A2621]'
                : 'border border-[#1C1A16]/15 text-[#1C1A16] hover:border-[#1C1A16]/40 hover:bg-[#1C1A16]/[0.03]'
          }`}
        >
          {buttonLabel}
        </button>
        {plan.footnote && (
          <p className="text-[11px] text-[#1C1A16]/40 text-center mt-2.5">{plan.footnote}</p>
        )}
      </div>
    </div>
  );
}

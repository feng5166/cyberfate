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
    <div className="group relative cursor-pointer" onClick={onClick}>
      {/* 角标：早鸟优惠 */}
      {plan.badge && !isCurrentPlan && (
        <div className="absolute top-0 right-0 z-10">
          <span className="inline-block bg-brand-accent text-white text-xs px-3.5 py-1.5 rounded-tr-2xl rounded-bl-2xl font-medium">
            {plan.badge}
          </span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 z-10">
          <span className="inline-block bg-brand-accent text-white text-xs px-3.5 py-1.5 rounded-tr-2xl rounded-bl-2xl font-medium">
            ✓ 当前计划
          </span>
        </div>
      )}

      <div
        className={`relative overflow-hidden flex flex-col p-6 md:p-9 bg-white rounded-2xl transition-all duration-300 ${
          isCurrentPlan || isSelected
            ? 'ring-2 ring-brand-accent'
            : highlighted
              ? 'ring-1 ring-brand-accent/50 hover:shadow-card-hover'
              : 'ring-1 ring-[#1C1A16]/8 hover:shadow-card-hover'
        }`}
      >
        {/* hover 顶部墨色色条（可点击卡统一语言） */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
          style={{ background: '#1C1A16' }}
        />
        {/* 标题 + 副标题 */}
        <h2 className="text-h3 font-semibold text-brand-ink">
          {highlighted ? (
            <span className="bg-brand-accent-soft px-1.5 rounded">{plan.name}</span>
          ) : (
            plan.name
          )}
        </h2>
        <p className="text-body-sm text-brand-gray mt-1.5">{plan.subtitle}</p>

        {/* 价格 */}
        <div className="flex items-end gap-2 mt-5">
          <div className="flex items-end">
            <span className="text-[34px] font-bold leading-none text-brand-ink">{currencySymbol}</span>
            <span className="text-[34px] font-bold leading-none text-brand-ink">{plan.displayPrice}</span>
          </div>
          <span className="text-body-sm text-brand-gray pb-0.5">{plan.periodLabel}</span>
          {plan.originalDisplayPrice && (
            <span className="text-body-sm text-brand-light line-through pb-0.5 ml-1">
              原价 {currencySymbol}{plan.originalDisplayPrice}{plan.periodLabel}
            </span>
          )}
        </div>

        {/* 价格锁定提示 banner */}
        {plan.lockPriceNote && (
          <div className="flex items-start gap-2.5 mt-5 bg-brand-accent-soft rounded-xl px-4 py-3">
            <BadgeCheck className="w-5 h-5 text-brand-accent mt-px shrink-0" strokeWidth={2} />
            <p className="text-body-sm text-brand-ink/80 leading-relaxed">{plan.lockPriceNote}</p>
          </div>
        )}

        {/* 权益 */}
        <p className="text-body-sm text-brand-gray mt-6 mb-3">{plan.perksTitle}</p>
        <ul className="space-y-2.5">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-body-sm text-brand-ink/85">
              <Check className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" strokeWidth={2.5} />
              {perk}
            </li>
          ))}
        </ul>

        {/* 适合人群 */}
        {plan.audience.length > 0 && (
          <>
            <p className="text-body-sm text-brand-gray mt-6 mb-3">{plan.audienceTitle}</p>
            <ul className="space-y-2.5">
              {plan.audience.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-body-sm text-brand-gray">
                  <Info className="w-4 h-4 text-brand-light mt-0.5 shrink-0" strokeWidth={2} />
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
          className={`w-full min-h-[48px] rounded-lg text-body-sm transition-colors mt-7 ${
            isCurrentPlan
              ? 'bg-brand-accent-soft text-brand-accent border border-brand-accent/30 font-medium cursor-default'
              : highlighted && !isSubscribed
                ? 'bg-brand-accent text-white hover:bg-brand-accent-hover font-semibold tracking-[0.08em]'
                : 'bg-white border border-brand-ink/25 text-brand-ink hover:border-brand-ink hover:bg-[#FDFBF7] font-medium'
          }`}
        >
          {buttonLabel}
        </button>
        {plan.footnote && (
          <p className="text-caption text-brand-gray text-center mt-2.5">{plan.footnote}</p>
        )}
      </div>
    </div>
  );
}

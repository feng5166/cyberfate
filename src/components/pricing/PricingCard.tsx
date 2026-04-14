'use client';

import { Check } from 'lucide-react';

export interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  recommended: boolean;
  perks: string[];
  isSelected: boolean;
  onClick: () => void;
  onCTAClick: () => void;
}

export function PricingCard({
  name,
  price,
  period,
  recommended,
  perks,
  isSelected,
  onClick,
  onCTAClick,
}: PricingCardProps) {
  return (
    <div
      className={`flex-1 cursor-pointer ${recommended ? 'relative' : ''}`}
      onClick={onClick}
    >
      {recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block bg-[#1C1A16] text-white text-xs px-3 py-1 rounded-full font-medium">
            ★ 最受欢迎
          </span>
        </div>
      )}
      <div
        className={`h-full flex flex-col p-5 md:p-9 bg-white rounded-2xl transition-all duration-300 ${
          isSelected
            ? 'shadow-md ring-2 ring-[#1C1A16] lg:scale-[1.03] lg:-translate-y-2'
            : 'shadow-sm hover:shadow-md hover:-translate-y-1'
        }`}
      >
        <h2 className="text-[20px] font-semibold text-[#1C1A16] text-center mb-4">
          {name}
        </h2>

        <div className="text-center mb-6 pb-6 border-b border-[#1C1A16]/8">
          <div className="flex items-end justify-center gap-1">
            <span className="text-[40px] font-semibold leading-none text-[#1C1A16]">¥</span>
            <span className="text-[40px] font-semibold leading-none text-[#1C1A16]">{price}</span>
          </div>
          <span className="text-sm text-[#1C1A16]/55 ml-1">{period}</span>
        </div>

        <ul className="space-y-3 flex-1 mb-8">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-sm text-[#1C1A16]/80">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
              {perk}
            </li>
          ))}
        </ul>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCTAClick();
          }}
          className={`w-full h-12 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-[#1C1A16] text-white hover:bg-[#2A2621]'
              : 'border border-[#1C1A16]/15 text-[#1C1A16] hover:border-[#1C1A16]/40 hover:bg-[#1C1A16]/[0.03]'
          }`}
        >
          {isSelected ? '立即开通' : '选择方案'}
        </button>
      </div>
    </div>
  );
}

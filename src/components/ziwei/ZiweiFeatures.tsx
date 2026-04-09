'use client';

import { Compass, LayoutGrid, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Compass,
    title: '精准排盘',
    description: '星曜定位精准，支持真太阳时校正，确保命盘排列准确无误',
    gradient: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: LayoutGrid,
    title: '十二宫详解',
    description: '命宫、财帛、事业等十二宫全面解读，深入分析每宫星曜组合含义',
    gradient: 'from-emerald-50 to-green-50',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Sparkles,
    title: 'AI 分析',
    description: '智能解读命盘格局与运势，结合四化飞星给出个性化分析建议',
    gradient: 'from-amber-50 to-yellow-50',
    iconColor: 'text-amber-500',
  },
];

export function ZiweiFeatures() {
  return (
    <section aria-label="特性介绍">
      <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] text-center mb-6">
        特性介绍
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={`bg-gradient-to-br ${feature.gradient} rounded-2xl border border-[#F0EDE8] p-5 sm:p-6 text-center`}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm mb-4">
              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
            <h3 className="font-display text-base font-semibold text-[#1C1A16] mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-[#1C1A16]/55 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

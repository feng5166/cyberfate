'use client';

import { Compass, LayoutGrid, Sparkles } from 'lucide-react';

// 紫微斗数模块点缀色（设计系统 §2.2）：淡底 #F3E8FF / 主色 #7E22CE
const ZIWEI_BG = '#F3E8FF';
const ZIWEI_FG = '#7E22CE';

const FEATURES = [
  {
    icon: Compass,
    title: '精准排盘',
    description: '星曜定位精准，支持真太阳时校正，确保命盘排列准确无误',
  },
  {
    icon: LayoutGrid,
    title: '十二宫详解',
    description: '命宫、财帛、事业等十二宫全面解读，深入分析每宫星曜组合含义',
  },
  {
    icon: Sparkles,
    title: 'AI 分析',
    description: '智能解读命盘格局与运势，结合四化飞星给出个性化分析建议',
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
            className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5 sm:p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div
              className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-full mb-4"
              style={{ background: ZIWEI_BG }}
            >
              <feature.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: ZIWEI_FG }} />
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

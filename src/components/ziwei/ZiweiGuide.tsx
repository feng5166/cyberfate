'use client';

import { PenLine, LayoutGrid, MousePointerClick, Sparkles, ArrowRight } from 'lucide-react';

// 紫微斗数模块点缀色（设计系统 §2.2）：淡底 #F3E8FF / 主色 #7E22CE
const ZIWEI_BG = '#F3E8FF';
const ZIWEI_FG = '#7E22CE';

const STEPS = [
  {
    icon: PenLine,
    step: 1,
    title: '输入信息',
    description: '日期 + 时辰 + 性别',
  },
  {
    icon: LayoutGrid,
    step: 2,
    title: '查看命盘',
    description: '十二宫星曜分布',
  },
  {
    icon: MousePointerClick,
    step: 3,
    title: '点击宫位',
    description: '查看详细星曜列表',
  },
  {
    icon: Sparkles,
    step: 4,
    title: 'AI 分析',
    description: '获取个性化解读',
  },
];

export function ZiweiGuide() {
  return (
    <section aria-label="使用指南">
      <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] text-center mb-6">
        使用指南
      </h2>
      <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0">
        {STEPS.map((step, index) => (
          <div key={step.step} className="flex items-center flex-1">
            <div className="flex-1 bg-white rounded-2xl border border-[#1C1A16]/8 p-4 sm:p-5 text-center">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
                style={{ background: ZIWEI_BG }}
              >
                <step.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: ZIWEI_FG }} />
              </div>
              <div className="text-[10px] text-[#1C1A16]/30 font-medium mb-1">
                Step {step.step}
              </div>
              <h3 className="text-sm font-semibold text-[#1C1A16] mb-1">{step.title}</h3>
              <p className="text-xs text-[#1C1A16]/50">{step.description}</p>
            </div>
            {index < STEPS.length - 1 && (
              <ArrowRight className="w-4 h-4 text-[#1C1A16]/20 mx-2 shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { CalendarDays, MessageCircleQuestion, Scale } from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: '传统历法引擎',
    desc: '融合万年历、干支纪年、节气算法，数据精准可靠',
  },
  {
    icon: MessageCircleQuestion,
    title: '智能场景分析',
    desc: '结合当日黄历数据，针对你的具体问题给出个性化建议',
  },
  {
    icon: Scale,
    title: '理性参考工具',
    desc: '黄历为文化参考，重要决策请结合实际情况理性判断',
  },
];

const STEPS = [
  { title: '选择日期', desc: '在日历中选择你想查询的日期' },
  { title: '查看分析', desc: '浏览当日的宜忌、五行、冲煞等信息' },
  { title: 'AI 建议', desc: '输入你的计划，获取个性化建议' },
];

export function FeaturesSection() {
  return (
    <div className="space-y-10">
      {/* 特性介绍 */}
      <div>
        <h3 className="font-display text-lg font-semibold text-[#1C1A16] text-center mb-5">
          为什么选择 AI 老黄历
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-[#1C1A16]/8 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#FEE2E2' }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#DC2626' }} />
                </div>
                <h4 className="text-sm font-semibold text-[#1C1A16] mb-2">{f.title}</h4>
                <p className="text-xs text-[#1C1A16]/55 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 使用指南 */}
      <div>
        <h3 className="font-display text-lg font-semibold text-[#1C1A16] text-center mb-5">
          使用指南
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center gap-4 md:gap-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{ background: '#FEE2E2' }}
                >
                  <span className="font-display text-lg font-semibold" style={{ color: '#DC2626' }}>
                    {i + 1}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-[#1C1A16] mb-1">{step.title}</h4>
                <p className="text-xs text-[#1C1A16]/55 max-w-[140px]">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="text-[#1C1A16]/20 text-lg hidden md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

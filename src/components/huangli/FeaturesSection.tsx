'use client';

const FEATURES = [
  {
    icon: '📊',
    title: '传统历法引擎',
    desc: '融合万年历、干支纪年、节气算法，数据精准可靠',
  },
  {
    icon: '🤖',
    title: '智能场景分析',
    desc: '结合当日黄历数据，针对你的具体问题给出个性化建议',
  },
  {
    icon: '🔬',
    title: '理性参考工具',
    desc: '黄历为文化参考，重要决策请结合实际情况理性判断',
  },
];

const STEPS = [
  { icon: '📅', title: '选择日期', desc: '在日历中选择你想查询的日期' },
  { icon: '👁️', title: '查看分析', desc: '浏览当日的宜忌、五行、冲煞等信息' },
  { icon: '💬', title: 'AI 建议', desc: '输入你的计划，获取个性化建议' },
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
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-5 text-center shadow-sm border border-[#F0EDE8]"
            >
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h4 className="text-sm font-medium text-[#1C1A16] mb-2">{f.title}</h4>
              <p className="text-xs text-[#1C1A16]/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
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
                <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#F0EDE8] flex items-center justify-center mb-2">
                  <span className="text-xl">{step.icon}</span>
                </div>
                <h4 className="text-sm font-medium text-[#1C1A16] mb-1">{step.title}</h4>
                <p className="text-xs text-[#1C1A16]/50 max-w-[140px]">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-[#1C1A16]/20 text-lg hidden md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PalaceData } from './types';

interface ZiweiAiOverviewProps {
  palaces: PalaceData[];
  className?: string;
}

const TABS = [
  { key: 'overview', label: '命盘总览' },
  { key: 'sihua', label: '人生四化' },
  { key: 'dayun', label: '大运流年' },
] as const;

type TabKey = typeof TABS[number]['key'];

const TAB_CONTENT: Record<TabKey, { title: string; content: string }> = {
  overview: {
    title: '命盘总览',
    content: `此命盘紫微天府同宫于命宫，为"紫府同宫"上格，格局清正高贵。命主天生具有领导气质与组织才能，性格沉稳大气，处事有条不紊。

文昌左辅同会命宫，主聪慧好学、得贵人相助，学业事业均有所成。财帛宫贪狼旺度坐守，求财途径多元，中年后财运转旺。

官禄宫七杀独坐旺地，事业心强烈，适合开创性工作或技术领域。但迁移宫廉贞会火星地空，出外发展需谨慎，不宜频繁变动。

整体格局属中上之命，一生有贵气扶持，事业可成，但需注意健康与人际关系的维护。疾厄宫擎羊同宫，中年后需注意身体保养。`,
  },
  sihua: {
    title: '人生四化飞星',
    content: `【化禄】贪狼化禄在财帛宫 → 主一生财路亨通，尤其在营销、艺术、交际领域求财顺利。贪狼化禄增添人缘与桃花，社交能力出众。

【化权】紫微化权在命宫 → 增强领导力与决断力，命主在人群中自然居于核心地位。但需防过度强势而影响人际关系。

【化科】天机化科在交友宫 → 交友中多得学识渊博之人指点，社交圈层较高。学习能力强，善于从朋友处获取知识与信息。

【化忌】巨门化忌在疾厄宫 → 健康方面需特别注意消化系统与口腔问题，也暗示容易因口舌是非而引发精神压力。建议保持心态平和。

四化飞星整体格局：禄权入命财，科星助友，仅忌星落疾厄，属于上吉格局。事业与财运为人生主要优势，健康为需关注领域。`,
  },
  dayun: {
    title: '当前大运与流年',
    content: `【当前大运】第四大运（33-42岁）—— 大运走到官禄宫七杀星

此大运为事业冲刺期，七杀星主导力量强，适合拼搏进取。工作中将面临较大挑战，但也是建功立业的黄金时期。注意控制脾气与风险，不宜过度冒进。

【2026 流年运势】流年太岁在午位，冲动夫妻宫

今年感情运需注意，夫妻间沟通尤为重要。事业方面有武曲天相助力，财务决策可适度积极。下半年运势优于上半年，秋季为关键转折期。

【近期提醒】
• 5-7月：财运旺盛，适合投资理财
• 8-9月：注意人际关系，防小人口舌
• 10-12月：事业机遇期，把握晋升机会`,
  },
};

export function ZiweiAiOverview({ palaces, className }: ZiweiAiOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = TAB_CONTENT[activeTab].content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [activeTab]);

  const content = TAB_CONTENT[activeTab];

  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] overflow-hidden', className)}
      role="region"
      aria-label="AI 命盘解读"
    >
      {/* 标题栏 */}
      <div className="px-5 sm:px-6 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold text-[#1C1A16]">AI 命盘解读</h3>
        </div>

        {/* Tab 切换（SegmentedControl 样式） */}
        <div className="flex rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-white text-[#1C1A16] font-medium shadow-sm'
                  : 'text-[#1C1A16]/50 hover:text-[#1C1A16]/70',
              )}
              aria-selected={activeTab === tab.key}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="px-5 sm:px-6 py-5" role="tabpanel" aria-label={content.title}>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <div className="whitespace-pre-line text-sm text-[#1C1A16]/70 leading-relaxed">
              {content.content}
            </div>

            {/* 复制按钮 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/40 hover:text-[#1C1A16]/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FAF9F6]"
                aria-label="复制解读内容"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="加载中">
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-full" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[90%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[95%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[80%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[85%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[60%]" />
    </div>
  );
}

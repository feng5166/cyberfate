'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DayunSwitcherProps {
  birthYear?: number;
  className?: string;
}

interface DayunPeriod {
  label: string;
  ageRange: string;
  palace: string;
  description: string;
}

const MOCK_DAYUN: DayunPeriod[] = [
  { label: '第一大运', ageRange: '3-12岁', palace: '命宫', description: '紫微天府坐守，幼年聪慧，得长辈疼爱' },
  { label: '第二大运', ageRange: '13-22岁', palace: '兄弟', description: '太阳旺度，学业顺利，交友广泛' },
  { label: '第三大运', ageRange: '23-32岁', palace: '夫妻', description: '武曲天相同度，事业起步，感情稳定' },
  { label: '第四大运', ageRange: '33-42岁', palace: '官禄', description: '七杀旺地，事业冲刺，把握机遇' },
  { label: '第五大运', ageRange: '43-52岁', palace: '财帛', description: '贪狼化禄，财运亨通，收获丰厚' },
  { label: '第六大运', ageRange: '53-62岁', palace: '迁移', description: '廉贞平度，安定为宜，注意健康' },
];

const MOCK_LIUNIAN = [
  { year: 2024, stem: '甲', branch: '辰', summary: '事业有变动机会' },
  { year: 2025, stem: '乙', branch: '巳', summary: '贵人运旺，利合作' },
  { year: 2026, stem: '丙', branch: '午', summary: '感情运提升，注意财务' },
  { year: 2027, stem: '丁', branch: '未', summary: '学习进修好时机' },
  { year: 2028, stem: '戊', branch: '申', summary: '财运回升，稳步前进' },
];

export function DayunSwitcher({ birthYear = 1990, className }: DayunSwitcherProps) {
  const [activeIndex, setActiveIndex] = useState(3);
  const [view, setView] = useState<'dayun' | 'liunian'>('dayun');

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const currentDayunIndex = MOCK_DAYUN.findIndex((d) => {
    const [start, end] = d.ageRange.replace('岁', '').split('-').map(Number);
    return currentAge >= start && currentAge <= end;
  });

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6', className)}>
      {/* 标题 + 切换 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-[#1C1A16]">大运流年</h3>
        <div className="flex rounded-lg bg-[#FAF9F6] border border-[#E8E4DD] p-0.5">
          <button
            onClick={() => setView('dayun')}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-all',
              view === 'dayun' ? 'bg-white shadow-sm text-[#1C1A16] font-medium' : 'text-[#1C1A16]/50',
            )}
          >
            大运
          </button>
          <button
            onClick={() => setView('liunian')}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-all',
              view === 'liunian' ? 'bg-white shadow-sm text-[#1C1A16] font-medium' : 'text-[#1C1A16]/50',
            )}
          >
            流年
          </button>
        </div>
      </div>

      {view === 'dayun' ? (
        <>
          {/* 大运时间轴 */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              className="p-1 rounded-lg hover:bg-[#FAF9F6] text-[#1C1A16]/40 shrink-0"
              aria-label="上一大运"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1.5 flex-1 justify-center">
              {MOCK_DAYUN.map((period, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap',
                    activeIndex === idx
                      ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)] font-medium text-[#1C1A16]'
                      : idx === currentDayunIndex
                        ? 'border border-amber-300 bg-amber-50/50 text-amber-700'
                        : 'border border-[#E8E4DD] text-[#1C1A16]/50 hover:border-[#1C1A16]/20',
                  )}
                  aria-label={`${period.label} ${period.ageRange}`}
                >
                  {period.ageRange}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveIndex(Math.min(MOCK_DAYUN.length - 1, activeIndex + 1))}
              className="p-1 rounded-lg hover:bg-[#FAF9F6] text-[#1C1A16]/40 shrink-0"
              aria-label="下一大运"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 大运详情 */}
          <div className="rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[#1C1A16]">
                {MOCK_DAYUN[activeIndex].label}
              </span>
              <span className="text-xs text-[#1C1A16]/40">
                {MOCK_DAYUN[activeIndex].ageRange}
              </span>
              {activeIndex === currentDayunIndex && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  当前
                </span>
              )}
            </div>
            <p className="text-xs text-[#1C1A16]/40 mb-1">
              走{MOCK_DAYUN[activeIndex].palace}
            </p>
            <p className="text-sm text-[#1C1A16]/60 leading-relaxed">
              {MOCK_DAYUN[activeIndex].description}
            </p>
          </div>
        </>
      ) : (
        /* 流年列表 */
        <div className="space-y-2">
          {MOCK_LIUNIAN.map((ly) => (
            <div
              key={ly.year}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl border transition-all',
                ly.year === currentYear
                  ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]'
                  : 'border-[#E8E4DD]',
              )}
            >
              <span className="text-sm font-semibold text-[#1C1A16] min-w-[48px]">{ly.year}</span>
              <span className="text-xs text-[#1C1A16]/40 min-w-[36px]">{ly.stem}{ly.branch}年</span>
              <span className="text-sm text-[#1C1A16]/60 flex-1">{ly.summary}</span>
              {ly.year === currentYear && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                  今年
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

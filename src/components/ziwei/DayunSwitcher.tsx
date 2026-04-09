'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getAge, getBirthYear, getGanZhi, getCurrentDayunIndex, STARTING_AGE, DAYUN_SPAN } from '@/lib/utils/dayun';

interface DayunSwitcherProps {
  birthDate?: string; // 'YYYY-MM-DD'
  className?: string;
}

interface DayunPeriod {
  label: string;
  ageRange: string;
  startAge: number;
  endAge: number;
  yearRange: string;
  palace: string;
  description: string;
}

interface LiunianItem {
  year: number;
  stem: string;
  branch: string;
  summary: string;
}

const DAYUN_PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅'];
const DAYUN_DESCRIPTIONS = [
  '紫微天府坐守，幼年聪慧，得长辈疼爱',
  '太阳旺度，学业顺利，交友广泛',
  '武曲天相同度，事业起步，感情稳定',
  '七杀旺地，事业冲刺，把握机遇',
  '贪狼化禄，财运亨通，收获丰厚',
  '廉贞平度，安定为宜，注意健康',
  '天同巨门同度，生活平稳，宜守不宜攻',
  '太阴旺度，人际融洽，利合作发展',
  '天梁坐守，事业有成，名望提升',
  '破军独坐，变动期至，需审慎决策',
];

const LIUNIAN_SUMMARIES = [
  '新起点，适合规划与布局',
  '贵人运旺，利合作发展',
  '感情运提升，注意财务管理',
  '学习进修好时机，充实自我',
  '财运回升，稳步前进',
  '事业有变动机会，需审时度势',
  '人际拓展期，广结善缘',
  '沉淀积累，厚积薄发',
  '突破期至，把握良机',
  '收获之年，安享成果',
];

const NUM_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function generateDayunPeriods(birthYear: number, count: number): DayunPeriod[] {
  return Array.from({ length: count }, (_, i) => {
    const startAge = STARTING_AGE + i * DAYUN_SPAN;
    const endAge = startAge + DAYUN_SPAN - 1;
    const startYear = birthYear + startAge;
    const endYear = birthYear + endAge;
    return {
      label: `第${NUM_LABELS[i] ?? i + 1}大运`,
      ageRange: `${startAge}-${endAge}岁`,
      startAge,
      endAge,
      yearRange: `${startYear}-${endYear}`,
      palace: DAYUN_PALACES[i % DAYUN_PALACES.length],
      description: DAYUN_DESCRIPTIONS[i % DAYUN_DESCRIPTIONS.length],
    };
  });
}

function generateLiunian(birthYear: number): LiunianItem[] {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;
  const endYear = currentYear + 2;
  const items: LiunianItem[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const { stem, branch } = getGanZhi(year);
    const age = year - birthYear + 1;
    const summaryIdx = (year - startYear) % LIUNIAN_SUMMARIES.length;
    items.push({
      year,
      stem,
      branch,
      summary: `${age}岁 · ${LIUNIAN_SUMMARIES[summaryIdx]}`,
    });
  }
  return items;
}

export function DayunSwitcher({ birthDate, className }: DayunSwitcherProps) {
  const [view, setView] = useState<'dayun' | 'liunian'>('dayun');

  const birthYear = useMemo(() => getBirthYear(birthDate ?? ''), [birthDate]);

  const currentAge = useMemo(() => {
    if (!birthDate) return 30;
    return getAge(birthDate);
  }, [birthDate]);

  const currentYear = new Date().getFullYear();

  const dayunPeriods = useMemo(() => {
    const minCount = 6;
    const neededCount = Math.max(minCount, Math.ceil((currentAge - STARTING_AGE + DAYUN_SPAN) / DAYUN_SPAN));
    return generateDayunPeriods(birthYear, neededCount);
  }, [currentAge, birthYear]);

  const liunianItems = useMemo(() => generateLiunian(birthYear), [birthYear]);

  const currentDayunIndex = useMemo(() => {
    return dayunPeriods.findIndex(
      (d) => currentAge >= d.startAge && currentAge <= d.endAge,
    );
  }, [dayunPeriods, currentAge]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(currentDayunIndex >= 0 ? currentDayunIndex : 0);
  }, [currentDayunIndex]);

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
          <div className="relative mb-5">
            {/* 导航按钮 */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#1C1A16]/40 shrink-0 transition-colors"
                aria-label="上一大运"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#1C1A16]/40 flex-1 text-center">
                {dayunPeriods[activeIndex].label}
              </span>
              <button
                onClick={() => setActiveIndex(Math.min(dayunPeriods.length - 1, activeIndex + 1))}
                className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#1C1A16]/40 shrink-0 transition-colors"
                aria-label="下一大运"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 可视化时间线 */}
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="relative flex items-start min-w-max pt-2">
                {/* 底部横线 */}
                <div
                  className="absolute top-[18px] left-4 right-4 h-[2px] bg-[#E8E4DD]"
                  aria-hidden="true"
                />
                {/* 已过时间线高亮 */}
                {currentDayunIndex >= 0 && (
                  <div
                    className="absolute top-[18px] left-4 h-[2px] bg-amber-300 transition-all duration-500"
                    style={{
                      width: `${((currentDayunIndex + 1) / dayunPeriods.length) * 100}%`,
                      maxWidth: 'calc(100% - 32px)',
                    }}
                    aria-hidden="true"
                  />
                )}

                {dayunPeriods.map((period, idx) => {
                  const isCurrent = idx === currentDayunIndex;
                  const isActive = idx === activeIndex;
                  const isPast = currentDayunIndex >= 0 && idx < currentDayunIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className="flex flex-col items-center flex-1 min-w-[56px] group cursor-pointer"
                      aria-label={`${period.label} ${period.ageRange} ${period.palace}`}
                      aria-pressed={isActive}
                    >
                      {/* 节点 */}
                      <div
                        className={cn(
                          'relative w-4 h-4 rounded-full border-2 transition-all duration-300 z-10',
                          isActive
                            ? 'w-5 h-5 border-[#1C1A16] bg-[#1C1A16]'
                            : isCurrent
                              ? 'border-amber-400 bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]'
                              : isPast
                                ? 'border-amber-300 bg-amber-200'
                                : 'border-[#D4D0C8] bg-white group-hover:border-[#1C1A16]/30',
                        )}
                      >
                        {isCurrent && !isActive && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-amber-400/40" />
                        )}
                      </div>

                      {/* 年龄区间 */}
                      <span
                        className={cn(
                          'mt-2 text-[10px] leading-tight whitespace-nowrap transition-colors',
                          isActive
                            ? 'text-[#1C1A16] font-semibold'
                            : isCurrent
                              ? 'text-amber-700 font-medium'
                              : 'text-[#1C1A16]/35 group-hover:text-[#1C1A16]/60',
                        )}
                      >
                        {period.ageRange}
                      </span>

                      {/* 宫位名 */}
                      <span
                        className={cn(
                          'text-[10px] leading-tight mt-0.5 whitespace-nowrap transition-colors',
                          isActive
                            ? 'text-[#1C1A16]/60'
                            : isCurrent
                              ? 'text-amber-600/60'
                              : 'text-[#1C1A16]/20',
                        )}
                      >
                        {period.palace}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 大运详情 */}
          <div
            className="rounded-xl border p-4 transition-all duration-300"
            style={{
              backgroundColor: activeIndex === currentDayunIndex ? '#FFFBEB' : '#FAF9F6',
              borderColor: activeIndex === currentDayunIndex ? '#FDE68A' : '#E8E4DD',
            }}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-[#1C1A16]">
                {dayunPeriods[activeIndex].label}
              </span>
              <span className="text-xs text-[#1C1A16]/40">
                {dayunPeriods[activeIndex].ageRange}（{dayunPeriods[activeIndex].yearRange}年）
              </span>
              {activeIndex === currentDayunIndex && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  当前（{currentAge}岁）
                </span>
              )}
            </div>
            <p className="text-xs text-[#1C1A16]/40 mb-1">
              走{dayunPeriods[activeIndex].palace}
            </p>
            <p className="text-sm text-[#1C1A16]/60 leading-relaxed">
              {dayunPeriods[activeIndex].description}
            </p>
          </div>
        </>
      ) : (
        /* 流年列表 */
        <div className="space-y-2">
          {liunianItems.map((ly) => (
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

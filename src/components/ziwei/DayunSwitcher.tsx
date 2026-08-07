'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PalaceData } from './types';
import type { TianGan } from '@/lib/ziwei/types';
import {
  calcZiweiDayun,
  calcZiweiLiunian,
  juNumberFromName,
  type ZiweiDayunItem,
} from '@/lib/ziwei/dayun';
import { PALACE_DOMAIN, describeLiunianBrief } from '@/lib/ziwei/quickRead';
import { track } from '@/lib/analytics';

/**
 * 大限 / 流年切换器（PRD-ZIWEI-V2 P0-A）：
 * 真实大限（五行局起限 + 阳男阴女顺行/阴男阳女逆行）+ 真实流年（流年命宫 + 流年四化）。
 * 替换 V1 的假线性大运（固定 3 岁起运 + 硬编码宫位描述模板）。
 */

interface DayunSwitcherProps {
  palaces: PalaceData[];
  birthDate: string;          // 'YYYY-MM-DD'
  /** 生年干支（排盘 API debug 口径，立春为界），如 '庚午' */
  yearGanZhi?: string;
  gender: 'male' | 'female';
  /** 五行局名，如 '水二局' */
  wuxingJu?: string;
  className?: string;
}

const NUM_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function dayunTheme(item: ZiweiDayunItem): string {
  const domain = PALACE_DOMAIN[item.palaceName] ?? item.palaceName;
  const starText = item.majorStars.length ? item.majorStars.join('') : '借对宫之力';
  return `这十年行${item.palaceName}宫（${starText}），人生主场景是${domain}。`;
}

export function DayunSwitcher({ palaces, birthDate, yearGanZhi, gender, wuxingJu, className }: DayunSwitcherProps) {
  const currentYear = new Date().getFullYear();
  const birthYear = Number(birthDate?.slice(0, 4)) || 0;

  const dayunList = useMemo<ZiweiDayunItem[]>(() => {
    if (!palaces.length || !birthYear || !yearGanZhi || !wuxingJu) return [];
    const ju = juNumberFromName(wuxingJu);
    if (!ju) return [];
    try {
      return calcZiweiDayun(palaces, {
        yearGan: yearGanZhi[0] as TianGan,
        gender,
        birthYear,
        juNumber: ju,
        currentYear,
      });
    } catch {
      return [];
    }
  }, [palaces, birthYear, yearGanZhi, gender, wuxingJu, currentYear]);

  const currentIndex = useMemo(() => {
    const idx = dayunList.findIndex((d) => d.isCurrent);
    return idx >= 0 ? idx : 0;
  }, [dayunList]);

  // 换盘时重置选中态（render 期派生，避免 effect 级联渲染）
  const [selectedIndexRaw, setSelectedIndexRaw] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [lastList, setLastList] = useState(dayunList);
  if (lastList !== dayunList) {
    setLastList(dayunList);
    setSelectedIndexRaw(null);
    setSelectedYear(null);
  }
  const selectedIndex = selectedIndexRaw ?? currentIndex;
  const setSelectedIndex = setSelectedIndexRaw;

  const selected = dayunList[selectedIndex] ?? null;

  // 该大限内的 10 个流年（真实流年命宫 + 四化）
  const liunianYears = useMemo(() => {
    if (!selected) return [];
    const years: Array<{ year: number; ganZhi: string; palaceName: string; brief: string }> = [];
    for (let y = selected.yearStart; y <= selected.yearEnd; y++) {
      const ln = calcZiweiLiunian(palaces, y);
      if (ln) {
        years.push({
          year: y,
          ganZhi: ln.ganZhi,
          palaceName: ln.palaceName,
          brief: describeLiunianBrief(ln.palaceName, ln.majorStars, ln.sihua),
        });
      }
    }
    return years;
  }, [selected, palaces]);

  const selectedLiunian = useMemo(
    () => liunianYears.find((l) => l.year === selectedYear) ?? null,
    [liunianYears, selectedYear],
  );

  if (!dayunList.length || !selected) return null;

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    setSelectedYear(null);
    track('ziwei_dayun_switch', { index: idx });
  };

  return (
    <div
      className={cn('bg-white rounded-2xl border border-[#1C1A16]/8 p-5 sm:p-6', className)}
      role="region"
      aria-label="大限流年"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-[#1C1A16]">大限流年</h3>
        <span className="text-[11px] text-[#1C1A16]/45">
          {wuxingJu}{yearGanZhi ? ` · ${yearGanZhi}年生` : ''} · {gender === 'female' ? '女' : '男'}命
        </span>
      </div>
      <p className="text-xs text-[#1C1A16]/45 mb-4">十年一宫；起限岁数与行进方向按五行局、阴阳男女真实推得</p>

      {/* 大限横条 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleSelect(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
          className="shrink-0 p-1.5 rounded-lg border border-[#1C1A16]/10 text-[#1C1A16]/50 hover:bg-[#FAF9F6] disabled:opacity-30 transition-colors"
          aria-label="上一大限"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {dayunList.map((d, idx) => (
              <button
                key={d.index}
                type="button"
                onClick={() => handleSelect(idx)}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-2 text-left transition-colors min-w-[92px]',
                  idx === selectedIndex
                    ? 'border-[#7E22CE]/50 bg-[#F3E8FF]/50'
                    : d.isCurrent
                      ? 'border-[#7E22CE]/25 bg-white'
                      : 'border-[#1C1A16]/10 bg-white hover:border-[#1C1A16]/25',
                )}
              >
                <p className="text-sm font-semibold text-[#1C1A16]">
                  {d.palaceName}
                  {d.isCurrent && <span className="ml-1 text-[10px] font-medium" style={{ color: '#7E22CE' }}>当前</span>}
                </p>
                <p className="text-[11px] text-[#1C1A16]/50 mt-0.5">{d.ageStart}-{d.ageEnd}岁</p>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSelect(Math.min(dayunList.length - 1, selectedIndex + 1))}
          disabled={selectedIndex === dayunList.length - 1}
          className="shrink-0 p-1.5 rounded-lg border border-[#1C1A16]/10 text-[#1C1A16]/50 hover:bg-[#FAF9F6] disabled:opacity-30 transition-colors"
          aria-label="下一大限"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 选中大限详情 */}
      <div className="mt-4 rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1C1A16]">
            第{NUM_LABELS[selected.index] ?? selected.index + 1}大限 · {selected.palaceName}宫
            {selected.stem ? `（${selected.stem}${selected.branch}）` : `（${selected.branch}）`}
          </span>
          <span className="text-xs text-[#1C1A16]/50">
            {selected.ageStart}-{selected.ageEnd} 虚岁 · {selected.yearStart}-{selected.yearEnd} 年
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/75">{dayunTheme(selected)}</p>

        {/* 流年条 */}
        <div className="mt-3 overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {liunianYears.map((l) => (
              <button
                key={l.year}
                type="button"
                onClick={() => setSelectedYear((prev) => (prev === l.year ? null : l.year))}
                className={cn(
                  'shrink-0 rounded-lg border px-2 py-1.5 text-center transition-colors',
                  selectedYear === l.year
                    ? 'border-[#7E22CE]/50 bg-white'
                    : l.year === currentYear
                      ? 'border-[#7E22CE]/25 bg-white'
                      : 'border-[#1C1A16]/8 bg-white/60 hover:border-[#1C1A16]/20',
                )}
              >
                <p className="text-xs font-medium text-[#1C1A16]">{l.year}</p>
                <p className="text-[10px] text-[#1C1A16]/45">{l.ganZhi}</p>
              </button>
            ))}
          </div>
        </div>
        {selectedLiunian && (
          <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/65">
            <span className="font-medium text-[#1C1A16]">{selectedLiunian.year} 年（{selectedLiunian.ganZhi}）：</span>
            {selectedLiunian.brief}
          </p>
        )}
      </div>
    </div>
  );
}

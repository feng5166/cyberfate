'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react';
import { getMonthLunarDays } from '@/lib/huangli/calculator';

interface CalendarPickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface LunarDayInfo {
  day: number;
  lunarDay: string;
  jieqi: string;
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

const WEEKDAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarPicker({ selectedDate, onDateSelect }: CalendarPickerProps) {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const { year: selY, month: selM } = parseDate(selectedDate);

  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM);
  const [lunarDays, setLunarDays] = useState<LunarDayInfo[]>([]);

  useEffect(() => {
    const days = getMonthLunarDays(viewYear, viewMonth);
    setLunarDays(days);
  }, [viewYear, viewMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    onDateSelect(todayStr);
  }, [onDateSelect, todayStr]);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    if (y >= 1920 && y <= 2100) {
      setViewYear(y);
      setViewMonth(m);
    }
  };

  const changeYear = (delta: number) => {
    const y = viewYear + delta;
    if (y >= 1920 && y <= 2100) {
      setViewYear(y);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

  const prevMonthDays = new Date(viewYear, viewMonth - 1, 0).getDate();

  const cells: { day: number; isCurrentMonth: boolean; dateStr: string; lunarDay: string; hasJieqi: boolean }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    let pm = viewMonth - 1;
    let py = viewYear;
    if (pm < 1) { pm = 12; py--; }
    cells.push({ day: d, isCurrentMonth: false, dateStr: formatDate(py, pm, d), lunarDay: '', hasJieqi: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const info = lunarDays[d - 1];
    cells.push({
      day: d,
      isCurrentMonth: true,
      dateStr: formatDate(viewYear, viewMonth, d),
      lunarDay: info?.lunarDay || '',
      hasJieqi: !!info?.jieqi,
    });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      let nm = viewMonth + 1;
      let ny = viewYear;
      if (nm > 12) { nm = 1; ny++; }
      cells.push({ day: d, isCurrentMonth: false, dateStr: formatDate(ny, nm, d), lunarDay: '', hasJieqi: false });
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-4">
      {/* 年份切换 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button
          onClick={() => changeYear(-1)}
          className="p-1 text-[#1C1A16]/40 hover:text-[#1C1A16] transition-colors"
          aria-label="上一年"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-[#1C1A16] min-w-[3rem] text-center">
          {viewYear}
        </span>
        <button
          onClick={() => changeYear(1)}
          className="p-1 text-[#1C1A16]/40 hover:text-[#1C1A16] transition-colors"
          aria-label="下一年"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* 月份切换 + 回到今天 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 text-[#1C1A16]/40 hover:text-[#1C1A16] transition-colors"
          aria-label="上个月"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[#1C1A16]">{viewMonth}月</span>
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth() + 1) && (
            <button
              onClick={goToToday}
              className="text-xs text-[#4A7C9B] hover:text-[#1C1A16] transition-colors flex items-center gap-0.5"
            >
              <CalendarDays className="w-3 h-3" />
              今天
            </button>
          )}
        </div>
        <button
          onClick={() => changeMonth(1)}
          className="p-1.5 text-[#1C1A16]/40 hover:text-[#1C1A16] transition-colors"
          aria-label="下个月"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 星期头 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((w, i) => (
          <div key={w} className={`text-center text-xs py-1 ${
            i === 0 || i === 6 ? 'text-[#C75B4B]/60' : 'text-[#1C1A16]/35'
          }`}>
            {w}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;

          if (!cell.isCurrentMonth) {
            return (
              <div key={idx} className="aspect-square flex flex-col items-center justify-center opacity-30">
                <span className="text-xs text-[#1C1A16]/40">{cell.day}</span>
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(cell.dateStr)}
              className={`
                aspect-square flex flex-col items-center justify-center relative rounded-lg
                transition-all duration-150 group
                ${isToday && isSelected
                  ? 'bg-[#1C1A16] text-white'
                  : isToday
                    ? 'bg-[#1C1A16] text-white'
                    : isSelected
                      ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]'
                      : 'hover:bg-[#1C1A16]/5'
                }
              `}
            >
              <span className={`text-sm font-medium leading-none ${
                isToday ? 'text-white' : isSelected ? 'text-[#1C1A16]' : 'text-[#1C1A16]'
              }`}>
                {cell.day}
              </span>
              <span className={`text-[9px] leading-none mt-0.5 ${
                cell.hasJieqi
                  ? isToday ? 'text-white/80' : 'text-[#4A7C9B]'
                  : isToday ? 'text-white/60' : 'text-[#1C1A16]/35'
              }`}>
                {cell.lunarDay}
              </span>
              {cell.hasJieqi && !isToday && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-[#4A7C9B]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

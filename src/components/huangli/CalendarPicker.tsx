'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react';
import { getTodayBeijing } from '@/lib/timezone';

interface CalendarPickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface LunarDayInfo {
  day: number;
  lunarDay: string;
  jieqi: string;
}

// 整月农历数据改经 /api/huangli?month=…（CDN immutable 长缓存）获取：
// 客户端不再 value-import lib/huangli/calculator——其顶层 require('lunar-javascript')
// 会把整库 299KB raw/97KB gz 拖进首屏。切月后小字标注异步补上，不阻塞日历主体。
// 缓存的是 Promise 而非结果：本组件同时挂了两份（桌面侧栏 + 移动端弹窗），
// 同一个月只发一次请求，并让后挂载的实例直接复用已解析的结果。
const monthRequests = new Map<string, Promise<LunarDayInfo[]>>();

function fetchMonth(key: string): Promise<LunarDayInfo[]> {
  let req = monthRequests.get(key);
  if (!req) {
    req = fetch(`/api/huangli?month=${key}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json: { days?: LunarDayInfo[] }) => (Array.isArray(json.days) ? json.days : []))
      .catch((err) => {
        monthRequests.delete(key); // 失败不留坏缓存，下次切回该月可重试
        throw err;
      });
    monthRequests.set(key, req);
  }
  return req;
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
  // 「今天」按北京时间判定（黄历是中国历法），与服务端 RSC 注入的初始日期口径一致；
  // 原本用本地时间，海外用户会与页面正文显示的日期差一天。
  const todayStr = getTodayBeijing();
  const { year: todayYear, month: todayMonth } = parseDate(todayStr);
  const { year: selY, month: selM } = parseDate(selectedDate);

  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM);
  // 按月存，切月时天然不会把上个月的农历名错位到新月格子上
  const [lunarByMonth, setLunarByMonth] = useState<Record<string, LunarDayInfo[]>>({});

  const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const lunarDays = lunarByMonth[monthKey] ?? [];

  useEffect(() => {
    if (lunarByMonth[monthKey]) return;
    let cancelled = false;
    fetchMonth(monthKey)
      .then((days) => {
        if (!cancelled) setLunarByMonth((prev) => ({ ...prev, [monthKey]: days }));
      })
      .catch(() => {
        // 失败只缺农历小字标注，日历选日主功能不受影响，静默降级
      });
    return () => { cancelled = true; };
  }, [monthKey, lunarByMonth]);

  const goToToday = useCallback(() => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    onDateSelect(todayStr);
  }, [onDateSelect, todayStr, todayYear, todayMonth]);

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
    <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-4">
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
          {(viewYear !== todayYear || viewMonth !== todayMonth) && (
            <button
              onClick={goToToday}
              className="text-xs text-[#DC2626]/80 hover:text-[#DC2626] transition-colors flex items-center gap-0.5"
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
            i === 0 || i === 6 ? 'text-[#DC2626]/50' : 'text-[#1C1A16]/35'
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
                  ? 'bg-brand-accent-soft text-brand-accent border-2 border-brand-accent'
                  : isSelected
                    ? 'border-2 border-brand-accent bg-brand-accent-tint'
                    : isToday
                      ? 'bg-brand-accent-tint hover:bg-brand-accent-soft'
                      : 'hover:bg-[#1C1A16]/5'
                }
              `}
            >
              <span className={`text-sm font-medium leading-none ${
                isToday ? 'text-[#1C1A16]' : isSelected ? 'text-[#1C1A16]' : 'text-[#1C1A16]'
              }`}>
                {cell.day}
              </span>
              <span className={`text-[9px] leading-none mt-0.5 ${
                cell.hasJieqi
                  ? 'text-[#DC2626]/70'
                  : isToday ? 'text-[#1C1A16]/50' : 'text-[#1C1A16]/35'
              }`}>
                {cell.lunarDay}
              </span>
              {isToday && !isSelected && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-accent" />
              )}
              {cell.hasJieqi && !isToday && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-[#DC2626]/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

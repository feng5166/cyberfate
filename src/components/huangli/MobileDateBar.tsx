'use client';

import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';

interface MobileDateBarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const QUICK_DATES = [
  { label: '昨天', delta: -1 },
  { label: '今天', delta: 0 },
  { label: '明天', delta: 1 },
  { label: '后天', delta: 2 },
];

export function MobileDateBar({ selectedDate, onDateSelect }: MobileDateBarProps) {
  const [showModal, setShowModal] = useState(false);
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {QUICK_DATES.map(({ label, delta }) => {
          const dateStr = addDays(todayStr, delta);
          const isActive = dateStr === selectedDate;
          return (
            <button
              key={label}
              onClick={() => onDateSelect(dateStr)}
              className={`
                flex-shrink-0 min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all
                ${isActive
                  ? 'bg-amber-100 text-[#1C1A16] border border-amber-300'
                  : 'bg-white text-[#1C1A16] border border-[#F0EDE8] hover:border-[#1C1A16]/30'
                }
              `}
            >
              {label}
            </button>
          );
        })}

        <button
          onClick={() => setShowModal(true)}
          aria-label="选择日期"
          className="flex-shrink-0 w-11 h-11 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center"
        >
          <CalendarDays className="w-5 h-5" />
        </button>
      </div>

      {/* 日历弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md bg-[#FAF9F6] rounded-t-3xl p-4 pb-[calc(2rem_+_env(safe-area-inset-bottom))] animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-[#1C1A16]">选择日期</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-[#1C1A16]/40 hover:text-[#1C1A16]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={(d) => {
                onDateSelect(d);
                setShowModal(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

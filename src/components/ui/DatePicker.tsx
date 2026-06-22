'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react'
import * as LunarJs from 'lunar-javascript'
import { cn } from '@/lib/utils/cn'

interface DatePickerProps {
  value: string // YYYY-MM-DD（lunar=true 时为农历年-月-日）
  onChange: (value: string) => void
  label?: string
  minYear?: number
  maxYear?: number
  className?: string
  triggerClassName?: string
  /** 农历模式：选择并展示农历年/月/日（正月…腊月 · 初一…三十） */
  lunar?: boolean
}

const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

/** 某农历月的天数（29 或 30）。取不到时回退 30。 */
function lunarMonthDayCount(year: number, month: number): number {
  try {
    const LunarMonth = (LunarJs as unknown as {
      LunarMonth?: { fromYm?: (y: number, mo: number) => { getDayCount?: () => number } | null }
    }).LunarMonth
    const m = LunarMonth?.fromYm?.(year, month)
    const c = m?.getDayCount?.()
    return c === 29 || c === 30 ? c : 30
  } catch {
    return 30
  }
}

export function DatePicker({
  value,
  onChange,
  label,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  className = '',
  triggerClassName = '',
  lunar = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0])
    return 2000
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1])
    return 1
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)
  const monthListRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? {
    year: parseInt(value.split('-')[0]),
    month: parseInt(value.split('-')[1]),
    day: parseInt(value.split('-')[2])
  } : null

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowYearPicker(false)
        setShowMonthPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 滚动到选中的年份
  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const selectedItem = yearListRef.current.querySelector('[data-selected="true"]')
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [showYearPicker])

  // 滚动到选中的月份
  useEffect(() => {
    if (showMonthPicker && monthListRef.current) {
      const selectedItem = monthListRef.current.querySelector('[data-selected="true"]')
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [showMonthPicker])

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const handleSelectDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(dateStr)
    setIsOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > minYear) {
        setViewYear(viewYear - 1)
        setViewMonth(12)
      }
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < maxYear) {
        setViewYear(viewYear + 1)
        setViewMonth(1)
      }
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const monthLabel = (m: number) => (lunar ? LUNAR_MONTHS[m - 1] : `${m}月`)

  const displayValue = value && selectedDate
    ? (lunar
        ? `${selectedDate.year}年${LUNAR_MONTHS[selectedDate.month - 1] ?? selectedDate.month + '月'}${LUNAR_DAYS[selectedDate.day - 1] ?? selectedDate.day}`
        : `${selectedDate.year}年${selectedDate.month}月${selectedDate.day}日`)
    : ''

  const placeholder = lunar ? '如 1990年正月初一' : '如 1990年1月1日'

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[#1C1A16]">{label}</label>
      )}

      <div
        className={cn(
          "relative w-full h-12 px-4 rounded-xl bg-white border border-[#1C1A16]/15 text-[#1C1A16] cursor-pointer flex items-center justify-between",
          triggerClassName
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue ? 'text-[#1C1A16]' : 'text-[#1C1A16]/40'}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-[#1C1A16]/40" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-[#1C1A16]/15 rounded-xl shadow-card-hover p-4 w-[320px]">
          {!showYearPicker && !showMonthPicker ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-background-alt rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowYearPicker(true)}
                    className="px-3 py-1 border border-[#1C1A16]/15 rounded-lg text-sm bg-white hover:bg-[#FAF9F6] flex items-center gap-1"
                  >
                    {viewYear}年
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMonthPicker(true)}
                    className="px-3 py-1 border border-[#1C1A16]/15 rounded-lg text-sm bg-white hover:bg-[#FAF9F6] flex items-center gap-1"
                  >
                    {monthLabel(viewMonth)}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-background-alt rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {lunar ? (
                // 农历日：初一…三十（按该月实际天数），不对齐星期
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: lunarMonthDayCount(viewYear, viewMonth) }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        'py-2 text-[13px] rounded hover:bg-[#FAF9F6]',
                        selectedDate &&
                          selectedDate.year === viewYear &&
                          selectedDate.month === viewMonth &&
                          selectedDate.day === day
                          ? 'bg-[#1C1A16] text-white hover:bg-[#1C1A16]'
                          : '',
                      )}
                    >
                      {LUNAR_DAYS[day - 1]}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-xs text-[#6B7280] py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={day === null}
                        onClick={() => day && handleSelectDay(day)}
                        className={`
                          p-2 text-sm rounded
                          ${day === null ? 'invisible' : 'hover:bg-[#FAF9F6]'}
                          ${selectedDate &&
                            selectedDate.year === viewYear &&
                            selectedDate.month === viewMonth &&
                            selectedDate.day === day
                              ? 'bg-[#1C1A16] text-white'
                              : ''}
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : showYearPicker ? (
            <div className="h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1C1A16]/10">
                <span className="text-sm font-medium text-[#1C1A16]">选择年份</span>
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  className="text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] hover:underline"
                >
                  完成
                </button>
              </div>

              <div
                ref={yearListRef}
                className="flex-1 overflow-y-auto"
              >
                {years.map(year => (
                  <button
                    key={year}
                    type="button"
                    data-selected={year === viewYear}
                    onClick={() => {
                      setViewYear(year)
                      setShowYearPicker(false)
                    }}
                    className={`
                      w-full py-3 text-center rounded
                      ${year === viewYear
                        ? 'bg-[#1C1A16] text-white font-medium'
                        : 'hover:bg-[#FAF9F6] text-[#1C1A16]/70'}
                    `}
                  >
                    {year}年
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1C1A16]/10">
                <span className="text-sm font-medium text-[#1C1A16]">选择月份</span>
                <button
                  type="button"
                  onClick={() => setShowMonthPicker(false)}
                  className="text-sm text-[#1C1A16]/70 hover:text-[#1C1A16] hover:underline"
                >
                  完成
                </button>
              </div>

              <div
                ref={monthListRef}
                className="flex-1 overflow-y-auto"
              >
                {months.map(month => (
                  <button
                    key={month}
                    type="button"
                    data-selected={month === viewMonth}
                    onClick={() => {
                      setViewMonth(month)
                      setShowMonthPicker(false)
                    }}
                    className={`
                      w-full py-3 text-center rounded
                      ${month === viewMonth
                        ? 'bg-[#1C1A16] text-white font-medium'
                        : 'hover:bg-[#FAF9F6] text-[#1C1A16]/70'}
                    `}
                  >
                    {monthLabel(month)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

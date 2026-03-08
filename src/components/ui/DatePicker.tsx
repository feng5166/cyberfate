'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown } from 'lucide-react'

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  minYear?: number
  maxYear?: number
}

export function DatePicker({ 
  value, 
  onChange, 
  label,
  minYear = 1940,
  maxYear = new Date().getFullYear()
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0])
    return 1990
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1])
    return 1
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)

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

  const displayValue = value 
    ? `${selectedDate?.year}年${selectedDate?.month}月${selectedDate?.day}日`
    : ''

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary">{label}</label>
      )}
      
      <div 
        className="relative w-full px-4 py-3 rounded bg-white border border-border text-primary cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue ? 'text-primary' : 'text-muted'}>
          {displayValue || '请选择出生日期'}
        </span>
        <Calendar className="w-5 h-5 text-muted" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-border rounded-lg shadow-lg p-4 w-[320px]">
          {!showYearPicker ? (
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
                    className="px-3 py-1 border border-border rounded text-sm bg-white hover:bg-background-alt flex items-center gap-1"
                  >
                    {viewYear}年
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value))}
                    className="px-2 py-1 border border-border rounded text-sm bg-white"
                  >
                    {months.map(m => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-background-alt rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs text-muted py-1">
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
                      ${day === null ? 'invisible' : 'hover:bg-background-alt'}
                      ${selectedDate && 
                        selectedDate.year === viewYear && 
                        selectedDate.month === viewMonth && 
                        selectedDate.day === day 
                          ? 'bg-black text-white' 
                          : ''}
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <span className="text-sm font-medium">选择年份</span>
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  className="text-sm text-primary hover:underline"
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
                      w-full py-2 text-center rounded
                      ${year === viewYear 
                        ? 'bg-black text-white font-medium' 
                        : 'hover:bg-background-alt'}
                    `}
                  >
                    {year}年
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

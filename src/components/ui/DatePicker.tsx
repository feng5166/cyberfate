'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

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
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0])
    return 1990
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1])
    return 1
  })
  const [yearInput, setYearInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 解析当前选中的日期
  const selectedDate = value ? {
    year: parseInt(value.split('-')[0]),
    month: parseInt(value.split('-')[1]),
    day: parseInt(value.split('-')[2])
  } : null

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 生成年份选项
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
  
  // 生成月份选项
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // 获取某月的天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // 获取某月第一天是星期几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  // 生成日历网格
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (number | null)[] = []
    
    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  // 选择日期
  const handleSelectDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(dateStr)
    setIsOpen(false)
  }

  // 上一月
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

  // 下一月
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

  // 键盘输入年份
  const handleYearInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && yearInput) {
      const year = parseInt(yearInput)
      if (year >= minYear && year <= maxYear) {
        setViewYear(year)
      }
      setYearInput('')
    }
  }

  // 格式化显示
  const displayValue = value 
    ? `${selectedDate?.year}年${selectedDate?.month}月${selectedDate?.day}日`
    : ''

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary">{label}</label>
      )}
      
      {/* 输入框 */}
      <div 
        className="relative w-full px-4 py-3 rounded bg-white border border-border text-primary cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue ? 'text-primary' : 'text-muted'}>
          {displayValue || '请选择出生日期'}
        </span>
        <Calendar className="w-5 h-5 text-muted" />
      </div>

      {/* 日历弹窗 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-border rounded-lg shadow-lg p-4 w-[320px]">
          {/* 年月选择器 */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-background-alt rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {/* 年份下拉 */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value))}
                className="px-2 py-1 border border-border rounded text-sm bg-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              
              {/* 月份下拉 */}
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

          {/* 快速输入年份 */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="输入年份快速定位..."
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleYearInput}
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-white"
            />
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-muted py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
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
                      ? 'bg-primary text-white' 
                      : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

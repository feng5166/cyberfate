'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarPicker } from '@/components/huangli/CalendarPicker';
import { MobileDateBar } from '@/components/huangli/MobileDateBar';
import { DayDetailCard } from '@/components/huangli/DayDetailCard';
import { ShenShaPanel } from '@/components/huangli/ShenShaPanel';
import { AiAskSection } from '@/components/huangli/AiAskSection';
import { FeaturesSection } from '@/components/huangli/FeaturesSection';
import type { HuangliData } from '@/lib/huangli/calculator';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HuangliPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);
  const [data, setData] = useState<HuangliData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const touchStartX = useRef(0);

  function addDays(dateStr: string, delta: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const handleSwipe = (deltaX: number) => {
    if (Math.abs(deltaX) < 50) return;
    setSelectedDate(prev => addDays(prev || getTodayStr(), deltaX < 0 ? 1 : -1));
  };

  const loadDate = useCallback(async (date: string) => {
    if (!date) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/huangli?date=${date}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '加载失败');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络连接不稳定，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 挂载即拉取今天的数据；后续 selectedDate 改变也会重新拉取
  useEffect(() => {
    const date = selectedDate || getTodayStr();
    if (!selectedDate) setSelectedDate(date);
    loadDate(date);
  }, [selectedDate, loadDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { handleSwipe(e.changedTouches[0].clientX - touchStartX.current); }}
    >
      {/* 移动端日期快捷条 - 置顶 */}
      <div className="lg:hidden px-4 pt-4">
        <MobileDateBar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* 标题区 */}
      <div className="text-center py-6 md:py-10 px-4">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#1C1A16]">
          AI 老黄历
        </h1>
        <p className="text-sm md:text-base text-[#1C1A16]/45 mt-2">
          智能择吉 · 避忌提醒
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex gap-6">
          {/* 左侧日历 - 桌面端 */}
          <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-[100px] self-start">
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* 加载状态 */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex gap-2">
                    <div className="h-6 w-28 bg-[#F0EDE8] rounded" />
                    <div className="h-6 w-16 bg-[#F0EDE8] rounded" />
                    <div className="h-6 w-20 bg-[#F0EDE8] rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-[#F0EDE8] rounded-xl" />
                    <div className="h-20 bg-[#F0EDE8] rounded-xl" />
                    <div className="h-20 bg-[#F0EDE8] rounded-xl" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-7 w-16 bg-[#F0EDE8] rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {error && !loading && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 text-center">
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <button
                  onClick={() => loadDate(selectedDate)}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}

            {/* 当日详情 */}
            {data && !loading && !error && (
              <>
                <DayDetailCard data={data} />
                <ShenShaPanel data={data} />
                <AiAskSection date={selectedDate} />
              </>
            )}

            {/* 底部特性介绍 */}
            <div className="mt-8">
              <FeaturesSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

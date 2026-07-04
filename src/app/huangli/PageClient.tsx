'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarPicker } from '@/components/huangli/CalendarPicker';
import { MobileDateBar } from '@/components/huangli/MobileDateBar';
import { DayDetailCard } from '@/components/huangli/DayDetailCard';
import { ShenShaPanel } from '@/components/huangli/ShenShaPanel';
import { AiAskSection } from '@/components/huangli/AiAskSection';
import { FeaturesSection } from '@/components/huangli/FeaturesSection';
import { Footer } from '@/components/layout/Footer';
import { PageShell, SplitLayout } from '@/components/ui';
import type { HuangliData } from '@/lib/huangli/calculator';
import { track } from '@/lib/analytics';

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
    const startTime = Date.now();
    track('huangli_view', { tool: 'huangli' });
    try {
      const res = await fetch(`/api/huangli?date=${date}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '加载失败');
      }
      const result = await res.json();
      setData(result);
      track('tool_ai_complete', { tool: 'huangli', duration_ms: Date.now() - startTime });
    } catch (err) {
      track('tool_ai_error', { tool: 'huangli', error_type: 'api_error' });
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
    <div className="min-h-dvh bg-[#FAF9F6]">
      {/* 移动端日期快捷条 - 置顶（左右滑动切换日期，手势限制在此区域，避免与纵向滚动打架） */}
      <div
        className="md:hidden px-4 pt-4"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { handleSwipe(e.changedTouches[0].clientX - touchStartX.current); }}
      >
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

      {/* 桌面 master-detail：lg+ 左日历(sticky) | 右当日详情；<lg 竖向堆叠（移动端日历随 hidden md:block 隐藏，由顶部 MobileDateBar 承担切日）。
          <SplitLayout> 在 <lg 按 DOM 顺序堆叠，aside 已 hidden md:block 故移动端不参与布局，视觉与原单列一致。 */}
      <PageShell width="chart" className="pb-16">
        <SplitLayout
          asidePosition="left"
          asideWidth={360}
          asideClassName="hidden md:block"
          aside={
            /* 选择日期日历 - 桌面侧栏（移动端顶部为日期快捷条，故整块 hidden md:block） */
            <div className="max-w-[380px] mx-auto">
              <CalendarPicker
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>
          }
          main={
            <div className="space-y-5">
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
                    className="min-h-[44px] px-5 text-sm bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 当日详情（随选中日期刷新） */}
              {data && !loading && !error && (
                <>
                  <DayDetailCard data={data} />
                  <ShenShaPanel data={data} />
                  <AiAskSection date={selectedDate} />
                </>
              )}

              {/* 底部特性介绍 + 使用指南 */}
              <div className="mt-8">
                <FeaturesSection />
              </div>
            </div>
          }
        />
      </PageShell>
    </div>
  );
}

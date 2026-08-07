'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarPicker } from '@/components/huangli/CalendarPicker';
import { MobileDateBar } from '@/components/huangli/MobileDateBar';
import { DayDetailCard } from '@/components/huangli/DayDetailCard';
import { ShenShaPanel } from '@/components/huangli/ShenShaPanel';
import { AiAskSection } from '@/components/huangli/AiAskSection';
import { FeaturesSection } from '@/components/huangli/FeaturesSection';
import { PageShell, SplitLayout } from '@/components/ui';
import type { HuangliData } from '@/lib/huangli/calculator';
import { getTodayBeijing } from '@/lib/timezone';
import { track } from '@/lib/analytics';

interface PageClientProps {
  /** 服务端（RSC）按北京时间注入的「今天」YYYY-MM-DD */
  initialDate: string;
  /** RSC 直出的当日黄历数据；null = 服务端计算失败，降级回客户端 fetch */
  initialData: HuangliData | null;
}

export default function HuangliPage({ initialDate, initialData }: PageClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [data, setData] = useState<HuangliData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const touchStartX = useRef(0);
  // 仅首次 effect 允许「跳过 fetch 直用 RSC 直出数据」，之后一律走网络
  const firstRunRef = useRef(true);

  // 日期加减一律走 UTC 分量：new Date('YYYY-MM-DD') 按 UTC 零点解析，再用本地分量格式化，
  // 在负时区（美西）会整体错一天 —— 左右滑动会出现「前进原地不动、后退跳两天」。
  function addDays(dateStr: string, delta: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + delta));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  }

  const handleSwipe = (deltaX: number) => {
    if (Math.abs(deltaX) < 50) return;
    setSelectedDate(prev => addDays(prev, deltaX < 0 ? 1 : -1));
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

  // 首帧直出：RSC 已注入当日数据则不再 fetch（SEO/首屏都吃现成 HTML）。
  // 仅当用户切换日期、或客户端北京日期 ≠ 服务端注入日期（ISR 缓存跨北京午夜陈旧）时才走 /api/huangli。
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      if (selectedDate === initialDate) {
        const clientToday = getTodayBeijing();
        if (clientToday !== initialDate) {
          // 缓存页已跨天：切到客户端的北京「今天」，由下一轮 effect 拉取
          setSelectedDate(clientToday);
          return;
        }
        if (initialData) {
          track('huangli_view', { tool: 'huangli' });
          return;
        }
      }
    }
    loadDate(selectedDate);
  }, [selectedDate, loadDate, initialDate, initialData]);

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
      <div className="relative overflow-hidden text-center py-8 md:py-12 px-4">
        {/* 罗盘细线装饰（品牌母题，克制） */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] md:w-[460px] md:h-[460px] opacity-[0.05]"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="196" fill="none" stroke="#1C1A16" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="#1C1A16" strokeWidth="0.6" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="#1C1A16" strokeWidth="0.6" strokeDasharray="2 4" />
            {Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1="200" y1="4" x2="200" y2={i % 2 === 0 ? 14 : 9}
                stroke="#1C1A16" strokeWidth="1"
                transform={`rotate(${i * 15} 200 200)`}
              />
            ))}
          </svg>
        </div>
        <span
          className="relative inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em]"
          style={{ background: '#FEE2E2', color: '#DC2626' }}
        >
          传统历法 · 智能择吉
        </span>
        <h1 className="relative font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] tracking-[0.08em] mt-4">
          AI 老黄历
        </h1>
        <p className="relative text-sm md:text-base text-[#1C1A16]/55 tracking-wider mt-3">
          每日宜忌 · 吉神凶煞 · 智能问事
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
                <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-6">
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
                <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
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

              {/* 底部特性介绍 + 使用指南（色带区块，打破整页单色） */}
              <div className="mt-8 rounded-2xl bg-[#F6F4F1] px-5 py-8 md:px-8 md:py-10">
                <FeaturesSection />
              </div>
            </div>
          }
        />
      </PageShell>
    </div>
  );
}

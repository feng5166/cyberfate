'use client';

import { useEffect, useRef, useState } from 'react';

interface DayunItem {
  index: number;
  ganzhi: string;
  tiangan: string;
  dizhi: string;
  shishen: string;
  shishenDesc: string;
  ageStart: number;
  ageEnd: number;
  yearStart: number;
  yearEnd: number;
  isCurrent: boolean;
}

interface LiunianItem {
  year: number;
  ganzhi: string;
  tiangan: string;
  dizhi: string;
  shishen: string;
  shishenDesc: string;
  age: number;
  isCurrent: boolean;
}

interface LiuyueItem {
  monthChinese: string;
  ganzhi: string;
  tiangan: string;
  dizhi: string;
  shishen: string;
  shishenDesc: string;
  isCurrent: boolean;
}

interface TimelineData {
  dayun: { current: DayunItem | null; list: DayunItem[] };
  liunian: { current: LiunianItem | null; list: LiunianItem[] };
  liuyue: { current: LiuyueItem | null; list: LiuyueItem[] };
}

interface TimelineSectionProps {
  birthDate?: string;
  birthHour?: string;
  gender?: string;
  targetDate?: string;
}

const CARD_BASE_STYLE: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 12,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  scrollSnapAlign: 'center',
  transition: 'all 0.2s ease',
};

// 当前柱高亮走模块点缀色（每日运势 #FBF1D0/#B0870F，见 docs/DESIGN-SYSTEM.md §2.2）
const HIGHLIGHT_STYLE: React.CSSProperties = {
  border: '1px solid #B0870F',
  background: '#FBF1D0',
};

const NORMAL_STYLE: React.CSSProperties = {
  border: '1px solid rgba(28, 26, 22, 0.08)',
  background: '#FFFFFF',
  opacity: 0.8,
};

const SUB_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#9CA3AF',
  marginBottom: 4,
};

const GANZHI_STYLE: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  fontFamily: "'Noto Serif SC', serif",
  color: '#1C1A16',
  lineHeight: 1.2,
};

const RANGE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  marginTop: 4,
};

const SHISHEN_DESC_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#9CA3AF',
  marginTop: 2,
};

function shishenBadgeStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 6,
    background: active ? '#B0870F' : '#F3F4F6',
    color: active ? '#FFFFFF' : '#6B7280',
  };
}

function ScrollRow({
  label,
  cardWidth,
  children,
  currentIndex,
  tooltipId,
  tooltipText,
  activeTooltip,
  onTooltipToggle,
}: {
  label: string;
  cardWidth: number;
  children: React.ReactNode;
  currentIndex: number;
  tooltipId?: string;
  tooltipText?: string;
  activeTooltip?: string | null;
  onTooltipToggle?: (id: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || currentIndex < 0) return;
    const container = scrollRef.current;
    const target = container.querySelector<HTMLElement>(`[data-card-idx="${currentIndex}"]`);
    if (target) {
      const targetLeft = target.offsetLeft - (container.clientWidth / 2) + (target.clientWidth / 2);
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [currentIndex]);

  return (
    <div className="flex items-stretch gap-3">
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center"
        style={{ width: 32 }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#6B7280',
            writingMode: 'vertical-rl',
            letterSpacing: '0.15em',
          }}
        >
          {label}
        </div>
        {tooltipId && tooltipText && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTooltipToggle?.(activeTooltip === tooltipId ? null : tooltipId);
              }}
              style={{
                marginTop: 4,
                fontSize: 14,
                color: '#9CA3AF',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 4,
              }}
              aria-label="说明"
            >
              ⓘ
            </button>
            {activeTooltip === tooltipId && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: -8,
                  zIndex: 50,
                  backgroundColor: '#1C1A16',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.6,
                  width: 200,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'normal',
                  writingMode: 'horizontal-tb',
                }}
              >
                {tooltipText}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          paddingBottom: 4,
          paddingLeft: 4,
          minWidth: 0,
        }}
      >
        {children}
        {/* fake spacer ensures cards can center */}
        <div style={{ flexShrink: 0, width: Math.max(0, cardWidth / 2) }} />
      </div>
    </div>
  );
}

function SkeletonRow({ width, count = 5 }: { width: number; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 flex-shrink-0" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-brand-border-light rounded-card flex-shrink-0"
            style={{ width, height: 96 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TimelineSection({
  birthDate,
  birthHour,
  gender,
  targetDate,
}: TimelineSectionProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (!birthDate || !birthHour) return;

    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          birthDate,
          birthHour,
          ...(gender ? { gender } : {}),
          ...(targetDate ? { targetDate } : {}),
        });
        const res = await fetch(`/api/bazi/timeline?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('timeline fetch failed');
        const json = (await res.json()) as TimelineData;
        if (!cancelled) setData(json);
      } catch (err) {
        if (cancelled) return;
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [birthDate, birthHour, gender, targetDate]);

  // 无出生信息
  if (!birthDate || !birthHour) {
    return (
      <div className="mb-8">
        <div
          className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5 text-center text-sm"
          style={{ color: '#6B7280' }}
        >
          📅 填写出生信息后查看完整命理脉络
        </div>
      </div>
    );
  }

  // 加载中
  if (loading || (!data && !error)) {
    return (
      <div className="mb-8">
        <div className="flex flex-col gap-3">
          <SkeletonRow width={120} />
          <SkeletonRow width={90} />
          <SkeletonRow width={110} />
        </div>
      </div>
    );
  }

  // 错误
  if (error || !data) {
    return (
      <div className="mb-8">
        <div
          className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5 text-center text-sm"
          style={{ color: '#9CA3AF' }}
        >
          命理脉络加载失败，刷新重试
        </div>
      </div>
    );
  }

  const dayunIdx = data.dayun.list.findIndex(d => d.isCurrent);
  const liunianIdx = data.liunian.list.findIndex(l => l.isCurrent);
  const liuyueIdx = data.liuyue.list.findIndex(l => l.isCurrent);
  const targetYear = targetDate ? parseInt(targetDate.split('-')[0]) : new Date().getFullYear();

  return (
    <div className="mb-8">
      <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium" style={{ color: '#1C1A16' }}>
            命理脉络
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            大运 · 流年 · 流月
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 大运 */}
          <ScrollRow
            label="大运"
            cardWidth={120}
            currentIndex={dayunIdx}
            tooltipId="dayun"
            tooltipText="大运每10年换一柱，代表你人生各阶段的整体运势底色"
            activeTooltip={activeTooltip}
            onTooltipToggle={setActiveTooltip}
          >
            {data.dayun.list.map((item, idx) => (
              <div
                key={`dayun-${item.index}-${item.ganzhi}`}
                data-card-idx={idx}
                style={{
                  ...CARD_BASE_STYLE,
                  ...(item.isCurrent ? HIGHLIGHT_STYLE : NORMAL_STYLE),
                  width: 120,
                }}
              >
                <div style={SUB_LABEL_STYLE}>第{item.index}运</div>
                <div style={GANZHI_STYLE}>{item.ganzhi}</div>
                <div style={RANGE_STYLE}>
                  {item.ageStart}-{item.ageEnd}岁
                </div>
                {item.shishen && (
                  <>
                    <span style={shishenBadgeStyle(item.isCurrent)}>{item.shishen}</span>
                    {item.shishenDesc && (
                      <div style={SHISHEN_DESC_STYLE}>{item.shishenDesc}</div>
                    )}
                  </>
                )}
                {item.isCurrent && (() => {
                  const totalYears = item.yearEnd - item.yearStart + 1;
                  const elapsed = targetYear - item.yearStart;
                  const progress = Math.min(Math.round(elapsed / totalYears * 100), 100);
                  return (
                    <div style={{ marginTop: 6, width: '100%' }}>
                      <div style={{ height: 2, backgroundColor: '#E5E7EB', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: progress + '%', backgroundColor: '#B0870F', borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>已走 {progress}%</p>
                    </div>
                  );
                })()}
              </div>
            ))}
          </ScrollRow>

          {/* 流年 */}
          <ScrollRow
            label="流年"
            cardWidth={90}
            currentIndex={liunianIdx}
            tooltipId="liunian"
            tooltipText="流年即当年太岁，影响该年整体运势格局"
            activeTooltip={activeTooltip}
            onTooltipToggle={setActiveTooltip}
          >
            {data.liunian.list.map((item, idx) => (
              <div
                key={`liunian-${item.year}`}
                data-card-idx={idx}
                style={{
                  ...CARD_BASE_STYLE,
                  ...(item.isCurrent ? HIGHLIGHT_STYLE : NORMAL_STYLE),
                  width: 90,
                }}
              >
                <div style={SUB_LABEL_STYLE}>{item.year}</div>
                <div style={GANZHI_STYLE}>{item.ganzhi}</div>
                <div style={RANGE_STYLE}>{item.age}岁</div>
                {item.shishen && (
                  <>
                    <span style={shishenBadgeStyle(item.isCurrent)}>{item.shishen}</span>
                    {item.shishenDesc && (
                      <div style={SHISHEN_DESC_STYLE}>{item.shishenDesc}</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </ScrollRow>

          {/* 流月 */}
          {data.liuyue.list.length > 0 && (
            <ScrollRow
              label="流月"
              cardWidth={110}
              currentIndex={liuyueIdx}
              tooltipId="liuyue"
              tooltipText="流月以节气为界，影响当月运势的细节走向"
              activeTooltip={activeTooltip}
              onTooltipToggle={setActiveTooltip}
            >
              {data.liuyue.list.map((item, idx) => (
                <div
                  key={`liuyue-${idx}-${item.ganzhi}`}
                  data-card-idx={idx}
                  style={{
                    ...CARD_BASE_STYLE,
                    ...(item.isCurrent ? HIGHLIGHT_STYLE : NORMAL_STYLE),
                    width: 110,
                  }}
                >
                  <div style={SUB_LABEL_STYLE}>{item.monthChinese}月</div>
                  <div style={GANZHI_STYLE}>{item.ganzhi}</div>
                  <div style={{ ...RANGE_STYLE, opacity: 0 }}>·</div>
                  {item.shishen && (
                    <>
                      <span style={shishenBadgeStyle(item.isCurrent)}>{item.shishen}</span>
                      {item.shishenDesc && (
                        <div style={SHISHEN_DESC_STYLE}>{item.shishenDesc}</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </ScrollRow>
          )}
        </div>
      </div>
    </div>
  );
}

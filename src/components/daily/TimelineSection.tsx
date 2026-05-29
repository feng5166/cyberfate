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

const HIGHLIGHT_STYLE: React.CSSProperties = {
  border: '1px solid #1C1A16',
  background: '#FAF8F4',
};

const NORMAL_STYLE: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  opacity: 0.8,
};

const SUB_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
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
  fontSize: 11,
  color: '#6B7280',
  marginTop: 4,
};

const SHISHEN_DESC_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#9CA3AF',
  marginTop: 2,
};

function shishenBadgeStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 6,
    background: active ? '#1C1A16' : '#F3F4F6',
    color: active ? '#FFFFFF' : '#6B7280',
  };
}

function ScrollRow({
  label,
  cardWidth,
  children,
  currentIndex,
}: {
  label: string;
  cardWidth: number;
  children: React.ReactNode;
  currentIndex: number;
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
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 32,
          fontSize: 12,
          color: '#6B7280',
          writingMode: 'vertical-rl',
          letterSpacing: '0.15em',
        }}
      >
        {label}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          paddingBottom: 4,
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
            className="animate-pulse bg-gray-100 rounded-xl flex-shrink-0"
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
          className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm"
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
          className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm"
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

  return (
    <div className="mb-8">
      <div
        className="rounded-xl border bg-white p-4"
        style={{ borderColor: '#E5E7EB' }}
      >
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
          <ScrollRow label="大运" cardWidth={120} currentIndex={dayunIdx}>
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
              </div>
            ))}
          </ScrollRow>

          {/* 流年 */}
          <ScrollRow label="流年" cardWidth={90} currentIndex={liunianIdx}>
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
            <ScrollRow label="流月" cardWidth={110} currentIndex={liuyueIdx}>
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

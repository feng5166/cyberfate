'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WuxingCount, WuXing } from '@/lib/bazi/types';

interface WuxingDonutChartProps {
  wuxing: WuxingCount;
  dayMasterElement: WuXing;
}

const ELEMENT_COLORS: Record<keyof WuxingCount, string> = {
  metal: '#A78BFA',
  wood: '#34D399',
  water: '#60A5FA',
  fire: '#F87171',
  earth: '#FBBF24',
};

const RING_SIZE = 120;
const STROKE = 16;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

export function WuxingDonutChart({ wuxing, dayMasterElement }: WuxingDonutChartProps) {
  const [progress, setProgress] = useState(0);

  const segments = useMemo(() => {
    const entries = Object.entries(wuxing) as Array<[keyof WuxingCount, number]>;
    const total = entries.reduce((sum, [, val]) => sum + Math.max(0, val), 0);
    if (!total) return [];

    let offset = 0;
    return entries.map(([key, value]) => {
      const normalized = Math.max(0, value);
      const ratio = normalized / total;
      const length = CIRCUMFERENCE * ratio;
      const segment = {
        key,
        color: ELEMENT_COLORS[key],
        length,
        offset,
      };
      offset += length;
      return segment;
    });
  }, [wuxing]);

  useEffect(() => {
    let frame = 0;
    let mounted = true;
    const startedAt = performance.now();
    const duration = 1000;

    const tick = (now: number) => {
      if (!mounted) return;
      const elapsed = now - startedAt;
      const percent = Math.min(1, elapsed / duration);
      setProgress(easeOutCubic(percent));
      if (percent < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setProgress(0);
    frame = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
    };
  }, [wuxing]);

  return (
    <div className="mx-auto h-[120px] w-[120px]">
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} role="img" aria-label="五行占比圆环图">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={STROKE}
        />
        <g transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}>
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length * progress} ${CIRCUMFERENCE}`}
              strokeDashoffset={-(segment.offset * progress)}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[#1C1A16] text-[15px] font-semibold"
        >
          {dayMasterElement}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[rgba(28,26,22,0.58)] text-[12px]"
        >
          命
        </text>
      </svg>
    </div>
  );
}

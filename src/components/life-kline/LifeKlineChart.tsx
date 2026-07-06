'use client';

import { useMemo, useRef, useState } from 'react';
import type { LifeKlineYearPoint } from '@/lib/bazi/lifeKline';

const UP_COLOR = '#059669';
const DOWN_COLOR = '#DC2626';
const MA_COLOR = '#D97706';

interface LifeKlineChartProps {
  points: LifeKlineYearPoint[];
  /** 当前虚岁（画「当前」虚线标记），null 不画 */
  currentAge: number | null;
  className?: string;
}

const VB_W = 1000;
const VB_H = 380;
const PAD = { top: 16, right: 16, bottom: 44, left: 40 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const Y_MIN = 0;
const Y_MAX = 100;

export function LifeKlineChart({ points, currentAge, className }: LifeKlineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const n = points.length;
  const slot = PLOT_W / n;
  const candleW = Math.max(3, slot * 0.62);

  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + PLOT_H * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));

  const maPath = useMemo(() => {
    let d = '';
    points.forEach((p, i) => {
      if (p.ma10 === null) return;
      d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.ma10).toFixed(1)}`;
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // X 轴刻度：每 10 年一档（第 1、11、21…岁）
  const ticks = useMemo(
    () => points.filter((_, i) => i % 10 === 0),
    [points],
  );

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * VB_W;
    const idx = Math.round((px - PAD.left - slot / 2) / slot);
    setHoverIdx(idx >= 0 && idx < n ? idx : null);
  };

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const currentIdx = currentAge !== null && currentAge >= 1 && currentAge <= n ? currentAge - 1 : null;

  return (
    <div className={className}>
      {/* 图例 */}
      <div className="flex items-center justify-center gap-5 text-xs text-[#1C1A16]/60 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: UP_COLOR }} />
          阳（运势上升）
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: DOWN_COLOR }} />
          阴（运势下降）
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ background: MA_COLOR }} />
          MA10（十年均线）
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto touch-pan-y select-none"
          role="img"
          aria-label="人生运势K线图"
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchStart={(e) => handleMove(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
          {/* 网格线 + Y 轴标签 */}
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={VB_W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="#1C1A16"
                strokeOpacity={v === 0 ? 0.18 : 0.06}
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end" fontSize={11} fill="#1C1A16" fillOpacity={0.45}>
                {v}
              </text>
            </g>
          ))}
          <text x={PAD.left - 8} y={PAD.top - 4} textAnchor="end" fontSize={10} fill="#1C1A16" fillOpacity={0.4}>
            运势分
          </text>

          {/* 当前年虚线 */}
          {currentIdx !== null && (
            <g>
              <line
                x1={x(currentIdx)}
                x2={x(currentIdx)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="#4F46E5"
                strokeOpacity={0.6}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
              <text x={x(currentIdx)} y={PAD.top - 4} textAnchor="middle" fontSize={11} fill="#4F46E5" fillOpacity={0.8}>
                当前
              </text>
            </g>
          )}

          {/* K线 */}
          {points.map((p, i) => {
            const up = p.close >= p.open;
            const color = up ? UP_COLOR : DOWN_COLOR;
            const bodyTop = y(Math.max(p.open, p.close));
            const bodyH = Math.max(1.5, Math.abs(y(p.open) - y(p.close)));
            return (
              <g key={p.age} opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.55}>
                <line x1={x(i)} x2={x(i)} y1={y(p.high)} y2={y(p.low)} stroke={color} strokeWidth={1} />
                <rect
                  x={x(i) - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={color}
                  rx={0.5}
                />
              </g>
            );
          })}

          {/* MA10 */}
          {maPath && <path d={maPath} fill="none" stroke={MA_COLOR} strokeWidth={1.6} strokeOpacity={0.85} />}

          {/* hover 十字线 */}
          {hover && hoverIdx !== null && (
            <line
              x1={x(hoverIdx)}
              x2={x(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="#1C1A16"
              strokeOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* X 轴标签：年份 + 岁数 */}
          {ticks.map((p) => {
            const i = p.age - 1;
            return (
              <g key={p.age}>
                <text x={x(i)} y={VB_H - 24} textAnchor="middle" fontSize={11} fill="#1C1A16" fillOpacity={0.5}>
                  {p.year}
                </text>
                <text x={x(i)} y={VB_H - 10} textAnchor="middle" fontSize={10} fill="#1C1A16" fillOpacity={0.35}>
                  {p.age}岁
                </text>
              </g>
            );
          })}
        </svg>

        {/* hover 提示卡 */}
        {hover && hoverIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none z-10 rounded-xl border border-[#1C1A16]/10 bg-white/95 shadow-lg px-3.5 py-2.5 text-xs leading-relaxed"
            style={
              hoverIdx < n / 2
                ? { left: `${((x(hoverIdx) + 14) / VB_W) * 100}%` }
                : { right: `${((VB_W - x(hoverIdx) + 14) / VB_W) * 100}%` }
            }
          >
            <p className="font-medium text-[#1C1A16]">
              {hover.year}年 · {hover.age}岁 · {hover.ganzhi}
            </p>
            <p className="text-[#1C1A16]/70 mt-1">
              开 {hover.open} · 收 {hover.close} · 高 {hover.high} · 低 {hover.low}
            </p>
            <p className="text-[#1C1A16]/70">
              等级 <span className="font-medium text-[#1C1A16]">{hover.level}</span>
              {hover.ma10 !== null && <> · MA10 {hover.ma10}</>}
            </p>
            <p className="text-[#1C1A16]/55 mt-0.5 max-w-[220px]">{hover.comment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

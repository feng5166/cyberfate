'use client';

import { useMemo, useRef, useState } from 'react';
import { Lock, MessageCircleQuestion } from 'lucide-react';
import type { DimKey, LifeKlineYearPoint } from '@/lib/bazi/lifeKline';
import { adviceForYear } from '@/lib/bazi/adviceTemplates';
import type { WuXing } from '@/lib/bazi/types';

const UP_COLOR = '#059669';
const DOWN_COLOR = '#DC2626';
const MA_COLOR = '#D97706';

/** 维度线颜色：取自模块点缀色板（小面积强调） */
const DIM_META: { key: DimKey; label: string; color: string }[] = [
  { key: 'wealth', label: '财运', color: '#B0870F' },
  { key: 'career', label: '事业', color: '#1D4ED8' },
  { key: 'love', label: '感情', color: '#BE185D' },
  { key: 'health', label: '健康', color: '#15803D' },
];

interface LifeKlineChartProps {
  points: LifeKlineYearPoint[];
  /** 当前虚岁（画「当前」虚线标记），null 不画 */
  currentAge: number | null;
  className?: string;
  /** 命格用神/忌神：传入后提示卡尾部显示宜忌行（P1-C） */
  mingGe?: { yongShen: WuXing; jiShen: WuXing };
  /** 分维度/流月是否已解锁（VIP）。未解锁时点击相应能力走 onPaywall */
  vipUnlocked?: boolean;
  onPaywall?: (feature: 'dims' | 'months') => void;
  /** 点击某年（VIP 流月下钻入口） */
  onYearClick?: (point: LifeKlineYearPoint) => void;
  /** 提示卡「问 AI」入口 */
  onAskAi?: (point: LifeKlineYearPoint) => void;
  /** 维度切换埋点回调 */
  onDimSwitch?: (dim: DimKey, active: boolean) => void;
}

const VB_W = 1000;
const VB_H = 380;
const PAD = { top: 16, right: 16, bottom: 44, left: 40 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const Y_MIN = 0;
const Y_MAX = 100;
/** 最多同时叠加的维度线（总运K线之外） */
const MAX_ACTIVE_DIMS = 2;

export function LifeKlineChart({
  points,
  currentAge,
  className,
  mingGe,
  vipUnlocked = false,
  onPaywall,
  onYearClick,
  onAskAi,
  onDimSwitch,
}: LifeKlineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [activeDims, setActiveDims] = useState<DimKey[]>([]);

  const n = points.length;
  const slot = PLOT_W / n;
  const candleW = Math.max(3, slot * 0.62);

  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + PLOT_H * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));

  const hasDims = points.length > 0 && points[0].dims !== undefined;

  const maPath = useMemo(() => {
    let d = '';
    points.forEach((p, i) => {
      if (p.ma10 === null) return;
      d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.ma10).toFixed(1)}`;
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const dimPaths = useMemo(() => {
    if (!hasDims) return {} as Record<DimKey, string>;
    const out = {} as Record<DimKey, string>;
    for (const { key } of DIM_META) {
      out[key] = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.dims![key]).toFixed(1)}`)
        .join('');
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, hasDims]);

  // X 轴刻度：每 10 年一档（第 1、11、21…岁）
  const ticks = useMemo(
    () => points.filter((_, i) => i % 10 === 0),
    [points],
  );

  const idxFromClientX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * VB_W;
    const idx = Math.round((px - PAD.left - slot / 2) / slot);
    return idx >= 0 && idx < n ? idx : null;
  };

  const handleMove = (clientX: number) => setHoverIdx(idxFromClientX(clientX));

  const handleDimToggle = (dim: DimKey) => {
    if (!vipUnlocked || !hasDims) {
      onPaywall?.('dims');
      return;
    }
    setActiveDims((prev) => {
      const active = prev.includes(dim);
      onDimSwitch?.(dim, !active);
      if (active) return prev.filter((d) => d !== dim);
      const next = [...prev, dim];
      return next.length > MAX_ACTIVE_DIMS ? next.slice(next.length - MAX_ACTIVE_DIMS) : next;
    });
  };

  const handleChartClick = (clientX: number) => {
    const idx = idxFromClientX(clientX);
    if (idx === null || !onYearClick) return;
    if (!vipUnlocked) {
      onPaywall?.('months');
      return;
    }
    onYearClick(points[idx]);
  };

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const currentIdx = currentAge !== null && currentAge >= 1 && currentAge <= n ? currentAge - 1 : null;
  const hoverAdvice = hover && mingGe
    ? adviceForYear({ level: hover.level, yongShen: mingGe.yongShen, jiShen: mingGe.jiShen, tenGod: hover.ganTenGod })
    : null;

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

      {/* 维度切换（P1-A）：总运免费；四维为 VIP 能力 */}
      {onPaywall && (
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] text-[#1C1A16]/40 mr-1">维度</span>
          <button
            type="button"
            onClick={() => setActiveDims([])}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeDims.length === 0
                ? 'border-[#1C1A16] bg-[#1C1A16] text-white'
                : 'border-[#1C1A16]/20 text-[#1C1A16]/70 hover:border-[#1C1A16]/50'
            }`}
          >
            总运
          </button>
          {DIM_META.map((d) => {
            const active = activeDims.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => handleDimToggle(d.key)}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? 'text-white'
                    : 'border-[#1C1A16]/20 text-[#1C1A16]/70 hover:border-[#1C1A16]/50'
                }`}
                style={active ? { background: d.color, borderColor: d.color } : undefined}
              >
                {!vipUnlocked && <Lock className="w-3 h-3" strokeWidth={1.5} />}
                {d.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative" onMouseLeave={() => setHoverIdx(null)}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={`w-full h-auto touch-pan-y select-none ${onYearClick ? 'cursor-pointer' : ''}`}
          role="img"
          aria-label="人生运势K线图"
          onMouseMove={(e) => handleMove(e.clientX)}
          onClick={(e) => handleChartClick(e.clientX)}
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

          {/* K线（叠加维度线时淡化作背景） */}
          {points.map((p, i) => {
            const up = p.close >= p.open;
            const color = up ? UP_COLOR : DOWN_COLOR;
            const bodyTop = y(Math.max(p.open, p.close));
            const bodyH = Math.max(1.5, Math.abs(y(p.open) - y(p.close)));
            const baseOpacity = activeDims.length > 0 ? 0.3 : 1;
            return (
              <g key={p.age} opacity={(hoverIdx === null || hoverIdx === i ? 1 : 0.55) * baseOpacity}>
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
          {maPath && activeDims.length === 0 && (
            <path d={maPath} fill="none" stroke={MA_COLOR} strokeWidth={1.6} strokeOpacity={0.85} />
          )}

          {/* 维度线（P1-A） */}
          {activeDims.map((key) => {
            const meta = DIM_META.find((d) => d.key === key)!;
            return (
              <path
                key={key}
                d={dimPaths[key]}
                fill="none"
                stroke={meta.color}
                strokeWidth={1.8}
                strokeOpacity={0.9}
              />
            );
          })}

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

        {/* hover 提示卡（可交互：宜忌 + 问 AI + 下钻提示） */}
        {hover && hoverIdx !== null && (
          <div
            className="absolute top-2 z-10 rounded-xl border border-[#1C1A16]/10 bg-white/95 shadow-lg px-3.5 py-2.5 text-xs leading-relaxed"
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
            {activeDims.length > 0 && hover.dims && (
              <p className="text-[#1C1A16]/70">
                {activeDims.map((key) => {
                  const meta = DIM_META.find((d) => d.key === key)!;
                  return (
                    <span key={key} className="mr-2">
                      <span style={{ color: meta.color }}>{meta.label}</span> {hover.dims![key]}
                    </span>
                  );
                })}
              </p>
            )}
            <p className="text-[#1C1A16]/70">
              最佳 {hover.bestMonth.month}月（{hover.bestMonth.ganzhi}） · 最差 {hover.worstMonth.month}月（{hover.worstMonth.ganzhi}）
            </p>
            <p className="text-[#1C1A16]/55 mt-0.5 max-w-[240px]">{hover.comment}</p>
            {hoverAdvice && (
              <p className="text-[#1C1A16]/65 mt-0.5 max-w-[240px]">
                宜 <span className="text-emerald-700">{hoverAdvice.yi.join('、')}</span> · 忌{' '}
                <span className="text-red-600/80">{hoverAdvice.ji.join('、')}</span>
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-3">
              {onAskAi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAi(hover);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium hover:gap-1.5 transition-all"
                  style={{ color: '#059669' }}
                >
                  <MessageCircleQuestion className="w-3.5 h-3.5" strokeWidth={1.5} />
                  这一年怎么安排？问 AI
                </button>
              )}
              {onYearClick && (
                <span className="text-[10px] text-[#1C1A16]/35">点击K线看流月</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

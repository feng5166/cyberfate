'use client';

import { MessageCircleQuestion, X } from 'lucide-react';
import type { LiuyueKlineResult, LifeKlineLevel } from '@/lib/bazi/lifeKline';
import { adviceForYear } from '@/lib/bazi/adviceTemplates';
import type { WuXing } from '@/lib/bazi/types';

const LEVEL_STYLE: Record<LifeKlineLevel, string> = {
  极盛: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  上佳: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  平稳: 'bg-[#F6F4F1] text-[#1C1A16]/70 border-[#1C1A16]/10',
  承压: 'bg-amber-50 text-amber-700 border-amber-200',
  低谷: 'bg-red-50 text-red-600 border-red-200',
};

const VB_W = 640;
const VB_H = 180;
const PAD = { top: 12, right: 12, bottom: 26, left: 34 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;

interface MonthDrillProps {
  data: LiuyueKlineResult;
  mingGe: { yongShen: WuXing; jiShen: WuXing };
  onAskAi?: (question: string) => void;
  onClose: () => void;
}

/** 流月下钻抽屉（P1-B）：某一年的 12 根月K线 + 每月宜忌 */
export function MonthDrill({ data, mingGe, onAskAi, onClose }: MonthDrillProps) {
  const points = data.points;
  const values = points.flatMap((p) => [p.high, p.low]);
  const yMin = Math.max(0, Math.min(...values) - 6);
  const yMax = Math.min(100, Math.max(...values) + 6);
  const slot = PLOT_W / 12;
  const candleW = Math.max(8, slot * 0.5);
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + PLOT_H * (1 - (v - yMin) / (yMax - yMin || 1));

  const best = points.reduce((a, b) => (b.close > a.close ? b : a));
  const worst = points.reduce((a, b) => (b.close < a.close ? b : a));

  return (
    <div className="mt-4 rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-display text-base font-semibold text-[#1C1A16]">
          {data.year}年流月 · {data.yearGanzhi}年（{data.age}岁）
        </h3>
        <span className="text-xs text-[#1C1A16]/45">
          最佳 {best.month}月（{best.ganzhi}） · 最需稳守 {worst.month}月（{worst.ganzhi}）
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭流月"
          className="p-1 rounded-lg text-[#1C1A16]/40 hover:text-[#1C1A16] hover:bg-[#1C1A16]/5 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto select-none" role="img" aria-label={`${data.year}年流月K线图`}>
        {[yMin, Math.round((yMin + yMax) / 2), yMax].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={VB_W - PAD.right} y1={y(v)} y2={y(v)} stroke="#1C1A16" strokeOpacity={0.06} strokeWidth={1} />
            <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#1C1A16" fillOpacity={0.4}>
              {Math.round(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const up = p.close >= p.open;
          const color = up ? '#059669' : '#DC2626';
          const bodyTop = y(Math.max(p.open, p.close));
          const bodyH = Math.max(1.5, Math.abs(y(p.open) - y(p.close)));
          return (
            <g key={p.month}>
              <line x1={x(i)} x2={x(i)} y1={y(p.high)} y2={y(p.low)} stroke={color} strokeWidth={1} />
              <rect x={x(i) - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} rx={1} />
              <text x={x(i)} y={VB_H - 8} textAnchor="middle" fontSize={10} fill="#1C1A16" fillOpacity={0.5}>
                {p.month}月
              </text>
            </g>
          );
        })}
      </svg>

      {/* 每月宜忌条 */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {points.map((p) => {
          const advice = adviceForYear({
            level: p.level,
            yongShen: mingGe.yongShen,
            jiShen: mingGe.jiShen,
            tenGod: p.tenGod,
          });
          return (
            <div key={p.month} className="rounded-lg bg-white border border-[#1C1A16]/6 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#1C1A16]">{p.month}月</span>
                <span className="text-[#1C1A16]/45">{p.ganzhi} · {p.tenGod}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border ${LEVEL_STYLE[p.level]}`}>
                  {p.level}
                </span>
              </div>
              <p className="mt-1 text-[#1C1A16]/60 leading-relaxed">
                宜 <span className="text-emerald-700">{advice.yi.join('、')}</span> · 忌{' '}
                <span className="text-red-600/80">{advice.ji.join('、')}</span>
              </p>
            </div>
          );
        })}
      </div>

      {onAskAi && (
        <button
          type="button"
          onClick={() =>
            onAskAi(`我 ${data.year} 年 ${best.month} 月前后运势最好，这段时间该重点做什么？${worst.month} 月要注意什么？`)
          }
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium hover:gap-2 transition-all"
          style={{ color: '#059669' }}
        >
          <MessageCircleQuestion className="w-3.5 h-3.5" strokeWidth={1.5} />
          就这一年的月度安排问问 AI 命理师
        </button>
      )}
    </div>
  );
}

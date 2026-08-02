'use client';

import { useEffect, useRef } from 'react';
import type { BranchInteraction, InteractionType } from '@/lib/bazi/interactions';
import type { PillarKey } from '@/lib/bazi/types';
import { track } from '@/lib/analytics';

/**
 * 刑冲会合害可视化（PRD-BAZI-V2 P1-C）：
 * 四柱地支横排为节点，两两关系画弧线；下方逐条白话解释。
 * 日支（婚姻宫）被触动时加重提示，措辞走「提醒-蓄力」框架。
 */

const PILLAR_ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];
const PILLAR_LABEL: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' };

/** 关系分类 → 颜色（语义色规范：合绿 / 会蓝 / 冲红 / 刑琥珀 / 害灰） */
function relationColor(type: InteractionType): string {
  if (type === '六合' || type === '三合' || type === '半三合') return '#059669';
  if (type === '三会') return '#1D4ED8';
  if (type === '六冲') return '#DC2626';
  if (type === '三刑' || type === '自刑') return '#D97706';
  return '#6B7280'; // 六害
}

/** 白话解释（提醒-蓄力-给建议框架，禁灾祸词） */
function explainInteraction(it: BranchInteraction, touchesDay: boolean): string {
  const branchText = it.branches.join('、');
  const hua = it.huaWuxing ? `，合化倾向${it.huaWuxing}` : '';
  const daySuffix = touchesDay ? '。涉及日支（婚姻宫），家宅与亲密关系的事宜多留一分心，重要决定放慢节奏更稳' : '';
  switch (it.type) {
    case '六合':
      return `${branchText}相合${hua}：这两股能量天然亲和，对应的人事关系容易顺畅联结${daySuffix}。`;
    case '三合':
      return `${branchText}三合成局${hua}：三支联手成一股合力，是命局里的稳定资源${daySuffix}。`;
    case '半三合':
      return `${branchText}半合${hua}：有成局之势但未满盘，遇流年补齐时合力更明显${daySuffix}。`;
    case '三会':
      return `${branchText}三会一方${hua}：同方气聚，能量集中，该五行主导的领域声量更大${daySuffix}。`;
    case '六冲':
      return `${branchText}相冲：两股能量对拉，对应领域易有变动与取舍——变动不是坏事，提前安排就是主动权${daySuffix}。`;
    case '三刑':
      return `${branchText}相刑${it.note ? `（${it.note}）` : ''}：相处与协作里易有摩擦点，宜明确边界、慢下判断${daySuffix}。`;
    case '自刑':
      return `${branchText}自刑：内耗式的自我较劲，提醒你对自己少一点苛责、多一点节奏感${daySuffix}。`;
    case '六害':
      return `${branchText}相害：暗性的消耗关系，人情往来留有余地即可化解大半${daySuffix}。`;
    default:
      return `${branchText}${it.type}。`;
  }
}

interface InteractionsCardProps {
  interactions: BranchInteraction[];
  /** 四柱地支（year/month/day/hour 顺序；无时柱传 null） */
  branches: Partial<Record<PillarKey, string | null>>;
  hasHour: boolean;
}

export function InteractionsCard({ interactions, branches, hasHour }: InteractionsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  // 进入视口埋点
  useEffect(() => {
    const el = ref.current;
    if (!el || trackedRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !trackedRef.current) {
        trackedRef.current = true;
        track('bazi_interactions_view', { count: interactions.length });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [interactions.length]);

  const visiblePillars = PILLAR_ORDER.filter((p) => (p === 'hour' ? hasHour : true));
  // SVG 节点坐标：均分横排
  const W = 320;
  const NODE_Y = 116;
  const xOf = (p: PillarKey) => {
    const idx = visiblePillars.indexOf(p);
    return ((idx + 0.5) / visiblePillars.length) * W;
  };

  // 每条关系拆成两两连线（三合/三会含 3 支）
  const arcs: Array<{ from: PillarKey; to: PillarKey; type: InteractionType; color: string }> = [];
  for (const it of interactions) {
    const ps = it.pillars.filter((p) => visiblePillars.includes(p));
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        arcs.push({ from: ps[i], to: ps[j], type: it.type, color: relationColor(it.type) });
      }
    }
  }

  return (
    <div ref={ref}>
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">地支关系 · 刑冲会合害</h3>
      <p className="text-xs text-brand-gray mb-4">四柱地支间的相互作用，是命局里的「力学结构」</p>

      {interactions.length === 0 ? (
        <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-4 py-5 text-center">
          <p className="text-sm text-[#1C1A16]/70">地支安静，命局平稳</p>
          <p className="text-xs text-[#1C1A16]/45 mt-1">四柱地支之间没有明显的刑冲会合害，能量运行相对独立而安稳。</p>
        </div>
      ) : (
        <>
          {/* 节点 + 弧线图 */}
          <div className="mx-auto max-w-[360px]">
            <svg viewBox={`0 0 ${W} 150`} className="w-full" role="img" aria-label="四柱地支关系图">
              {arcs.map((arc, i) => {
                const x1 = xOf(arc.from);
                const x2 = xOf(arc.to);
                const mid = (x1 + x2) / 2;
                const span = Math.abs(x2 - x1);
                // 弧顶高度随跨度变化，多条弧线错峰
                const peak = NODE_Y - 26 - span * 0.28 - (i % 3) * 9;
                return (
                  <g key={i}>
                    <path
                      d={`M ${x1} ${NODE_Y - 18} Q ${mid} ${peak} ${x2} ${NODE_Y - 18}`}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={1.5}
                      opacity={0.75}
                    />
                    <text
                      x={mid}
                      y={((NODE_Y - 18) + peak) / 2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill={arc.color}
                    >
                      {arc.type}
                    </text>
                  </g>
                );
              })}
              {visiblePillars.map((p) => {
                const x = xOf(p);
                const isDay = p === 'day';
                return (
                  <g key={p}>
                    <circle
                      cx={x}
                      cy={NODE_Y}
                      r={17}
                      fill={isDay ? '#FFF6E8' : '#FAF9F6'}
                      stroke={isDay ? '#B0870F' : 'rgba(28,26,22,0.15)'}
                      strokeWidth={isDay ? 1.5 : 1}
                    />
                    <text x={x} y={NODE_Y + 5} textAnchor="middle" fontSize="15" fontWeight="600" fill="#1C1A16">
                      {branches[p] ?? '—'}
                    </text>
                    <text x={x} y={NODE_Y + 34} textAnchor="middle" fontSize="10" fill="rgba(28,26,22,0.5)">
                      {PILLAR_LABEL[p]}支{isDay ? ' · 婚姻宫' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 逐条白话解释 */}
          <div className="mt-3 space-y-2">
            {interactions.map((it, i) => {
              const touchesDay = it.pillars.includes('day');
              return (
                <div
                  key={`${it.type}_${i}`}
                  className={`rounded-xl border px-4 py-3 ${
                    touchesDay ? 'border-[#B0870F]/30 bg-[#FFF6E8]/60' : 'border-[#1C1A16]/6 bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: relationColor(it.type) }}
                    >
                      {it.type}
                    </span>
                    <span className="text-sm font-medium text-[#1C1A16] tracking-[0.08em]">
                      {it.branches.join(' · ')}
                    </span>
                    {touchesDay && (
                      <span className="text-[11px] font-medium" style={{ color: '#B0870F' }}>
                        涉及婚姻宫
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#1C1A16]/65">
                    {explainInteraction(it, touchesDay)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

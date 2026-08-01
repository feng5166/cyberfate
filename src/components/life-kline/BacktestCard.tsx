'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, History, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { track } from '@/lib/analytics';
import type { BacktestPick, LifeKlineLevel, LifeKlineYearPoint } from '@/lib/bazi/lifeKline';

const LEVEL_STYLE: Record<LifeKlineLevel, string> = {
  极盛: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  上佳: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  平稳: 'bg-[#F6F4F1] text-[#1C1A16]/70 border-[#1C1A16]/10',
  承压: 'bg-amber-50 text-amber-700 border-amber-200',
  低谷: 'bg-red-50 text-red-600 border-red-200',
};

export type BacktestVote = 'yes' | 'no';
export type BacktestKind = 'peak' | 'trough';

interface BacktestState {
  peak?: BacktestVote;
  trough?: BacktestVote;
  skipped?: boolean;
}

/** 刑冲会合摘要 → 白话依据（提醒-解释框架，不用恐吓词） */
function explainBrief(brief: string): string {
  if (brief.startsWith('岁运并临')) return '流年与大运干支重叠，吉凶被同向放大，多是大事之年';
  if (brief.startsWith('伏吟日柱')) return '流年伏吟日柱，旧事重提、心绪反复之象';
  if (brief.startsWith('天克地冲日柱')) return '流年与日柱天克地冲，自身与家宅震动较大的一年';
  if (brief.startsWith('天克地冲大运')) return '流年与大运天克地冲，十年基调受到短期冲击';
  if (brief.startsWith('冲大运支')) return '流年冲动大运，环境与方向易生变数';
  if (brief.includes('日支')) return `流年${brief.slice(0, 2)}婚姻宫（日支），情感与家宅易起波澜`;
  if (brief.startsWith('六冲')) return '流年与命局相冲，变动奔波之象';
  if (brief.startsWith('三刑') || brief.startsWith('自刑')) return '刑星入命，人事纠葛、暗耗心力';
  if (brief.startsWith('六害')) return '相害入命，合作与人际需多留心';
  if (brief.startsWith('三合') || brief.startsWith('三会') || brief.startsWith('半三合')) {
    return brief.includes('助忌')
      ? '流年引动合局但助长忌神，热闹之中暗藏消耗'
      : '流年引动合局，五行之力汇聚，如有助力加持';
  }
  return brief;
}

function reasonsFor(point: LifeKlineYearPoint): string[] {
  if (point.interactionsBrief.length === 0) return [point.comment];
  return point.interactionsBrief.slice(0, 2).map(explainBrief);
}

/** 极值年标签按实际等级取词，避免「高光年」旁挂着「承压」徽章的自相矛盾 */
function kindLabel(kind: BacktestKind, level: LifeKlineLevel): string {
  if (kind === 'peak') {
    return level === '极盛' || level === '上佳' ? '推算的高光年' : '过去的相对高点';
  }
  return level === '低谷' || level === '承压' ? '推算的承压年' : '过去的相对低点';
}

interface YearVoteCardProps {
  kind: BacktestKind;
  point: LifeKlineYearPoint;
  vote: BacktestVote | undefined;
  onVote: (vote: BacktestVote) => void;
  onExploreFuture: () => void;
}

function YearVoteCard({ kind, point, vote, onVote, onExploreFuture }: YearVoteCardProps) {
  return (
    <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 p-4 flex flex-col">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-display text-base font-semibold text-[#1C1A16]">
          {point.year}年
        </span>
        <span className="text-xs text-[#1C1A16]/50">
          {point.age}岁 · 流年{point.ganzhi}
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${LEVEL_STYLE[point.level]}`}>
          {point.level}
        </span>
        <span className="text-[11px] text-[#1C1A16]/40">{kindLabel(kind, point.level)}</span>
      </div>
      <p className="mt-2 text-sm text-[#1C1A16]/70">{point.comment}</p>

      {vote === undefined ? (
        <div className="mt-3 pt-3 border-t border-[#1C1A16]/6">
          <p className="text-sm font-medium text-[#1C1A16]">这一年，你过得怎么样？</p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={() => onVote('yes')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1C1A16]/25 bg-white px-3 py-2 text-sm text-[#1C1A16] hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              准
            </button>
            <button
              type="button"
              onClick={() => onVote('no')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1C1A16]/25 bg-white px-3 py-2 text-sm text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
              不准
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[#1C1A16]/6">
          <p className="text-[11px] text-[#1C1A16]/45 mb-1.5">
            {vote === 'yes' ? '已记录：准 · 这一年的命理依据' : '已记录：不准 · 当年的命理推算依据'}
          </p>
          <ul className="space-y-1">
            {reasonsFor(point).map((r) => (
              <li key={r} className="text-[13px] leading-relaxed text-[#1C1A16]/65 flex gap-1.5">
                <span aria-hidden className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: '#059669' }} />
                {r}
              </li>
            ))}
          </ul>
          {vote === 'yes' && (
            <button
              type="button"
              onClick={onExploreFuture}
              className="mt-2.5 inline-flex items-center gap-1 hover:gap-2 transition-all text-[13px] font-medium"
              style={{ color: '#059669' }}
            >
              看看未来哪些年是这种级别
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface BacktestCardProps {
  pick: BacktestPick;
  /** 出生信息标识（切换命盘时重置投票状态与本地记忆） */
  birthKey: string;
  className?: string;
  onVote: (kind: BacktestKind, point: LifeKlineYearPoint, vote: BacktestVote) => void;
  onExploreFuture: () => void;
}

const storageKey = (birthKey: string) => `kline_backtest:${birthKey}`;

function loadState(birthKey: string): BacktestState {
  try {
    const raw = localStorage.getItem(storageKey(birthKey));
    return raw ? (JSON.parse(raw) as BacktestState) : {};
  } catch {
    return {};
  }
}

function saveState(birthKey: string, state: BacktestState) {
  try {
    localStorage.setItem(storageKey(birthKey), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function BacktestCard({ pick, birthKey, className, onVote, onExploreFuture }: BacktestCardProps) {
  const [state, setState] = useState<BacktestState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState(birthKey);
    setState(loaded);
    setHydrated(true);
    const done = loaded.skipped || (loaded.peak !== undefined && loaded.trough !== undefined);
    if (!done) track('kline_backtest_show', { peak_year: pick.peak.year, trough_year: pick.trough.year });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthKey]);

  if (!hydrated) return null;

  const done = state.skipped || (state.peak !== undefined && state.trough !== undefined);

  const handleVote = (kind: BacktestKind, vote: BacktestVote) => {
    const next = { ...state, [kind]: vote };
    setState(next);
    saveState(birthKey, next);
    onVote(kind, kind === 'peak' ? pick.peak : pick.trough, vote);
  };

  const handleSkip = () => {
    const next = { ...state, skipped: true };
    setState(next);
    saveState(birthKey, next);
    track('kline_backtest_skip', {});
  };

  const voteText = (v: BacktestVote | undefined) => (v === 'yes' ? '准 ✓' : v === 'no' ? '不准 ✗' : '未投');

  if (done) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-2.5 flex-wrap text-sm text-[#1C1A16]/60">
          <History className="w-4 h-4 shrink-0 text-[#1C1A16]/40" strokeWidth={1.5} />
          <span className="font-medium text-[#1C1A16]/80">过往回测</span>
          {state.skipped && state.peak === undefined && state.trough === undefined ? (
            <span>已跳过</span>
          ) : (
            <>
              <span>{pick.peak.year}年（高点）{voteText(state.peak)}</span>
              <span className="text-[#1C1A16]/25">·</span>
              <span>{pick.trough.year}年（低点）{voteText(state.trough)}</span>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center gap-2 mb-1">
        <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
        <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">先验过去</h2>
        <span className="text-sm text-[#1C1A16]/50">从你经历过的年份里，验一验这条K线</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-[#1C1A16]/40 hover:text-[#1C1A16]/70 transition-colors px-2 py-1"
        >
          跳过
        </button>
      </div>
      <p className="text-xs text-[#1C1A16]/45 mb-4">
        算法从你经历过的年份中推算出运势相对最高与最低的两年——凭记忆判断，它算得准吗？
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <YearVoteCard
          kind="peak"
          point={pick.peak}
          vote={state.peak}
          onVote={(v) => handleVote('peak', v)}
          onExploreFuture={onExploreFuture}
        />
        <YearVoteCard
          kind="trough"
          point={pick.trough}
          vote={state.trough}
          onVote={(v) => handleVote('trough', v)}
          onExploreFuture={onExploreFuture}
        />
      </div>
    </Card>
  );
}

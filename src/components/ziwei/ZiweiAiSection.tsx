'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Briefcase, Check, Coins, Compass, Heart, Lock, RefreshCw, ScrollText, Smile, Sparkles, UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AiGate } from '@/components/ai/useAiGate';
import { track } from '@/lib/analytics';

/**
 * 逐宫议题式 AI 解读 + 全盘详批（PRD-ZIWEI-V2 P0-B）：
 * 点哪个宫解读哪个宫（登录后免费 3 宫/日），全盘详批 VIP 专属。
 * 替换 V1 的静态假「AI 命盘解读」（STATIC_TAB_CONTENT）。
 */

const STRONG_PALACES: Array<{ name: string; hook: string; icon: typeof Briefcase }> = [
  { name: '命宫', hook: '我是什么底色', icon: UserRound },
  { name: '夫妻', hook: '感情与正缘', icon: Heart },
  { name: '财帛', hook: '财从哪里来', icon: Coins },
  { name: '官禄', hook: '事业怎么走', icon: Briefcase },
  { name: '迁移', hook: '外出与变动', icon: Compass },
  { name: '福德', hook: '心态与福气', icon: Smile },
];

const MORE_PALACES = ['兄弟', '子女', '疾厄', '交友', '田宅', '父母'];

function storageKey(chartKey: string) {
  return `ziwei_palace_reads::${chartKey}`;
}

function loadReads(chartKey: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(chartKey));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveReads(chartKey: string, reads: Record<string, string>) {
  try {
    window.localStorage.setItem(storageKey(chartKey), JSON.stringify(reads));
  } catch { /* 存储满忽略 */ }
}

/** 去掉【标题】行与 Markdown 残留，分段渲染 */
function renderText(text: string) {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .trim();
  return cleaned.split(/\n{2,}/).map((para, i) => {
    const m = para.match(/^【([^】]{1,12})】\s*/);
    if (m) {
      return (
        <div key={i}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#7E22CE' }}>【{m[1]}】</p>
          <p className="text-sm leading-loose text-[#1C1A16]/80 whitespace-pre-wrap">{para.slice(m[0].length).trim()}</p>
        </div>
      );
    }
    return (
      <p key={i} className="text-sm leading-loose text-[#1C1A16]/80 whitespace-pre-wrap">{para.trim()}</p>
    );
  });
}

interface ZiweiAiSectionProps {
  birthDate: string;
  birthHour: string;   // '0'-'11'
  gender: string;      // 'male' | 'female'
  isVip: boolean;
  gate: AiGate;
  /** 宫位详情面板「AI 深读此宫」触发：变更即生成该宫 */
  requestPalace?: { name: string; nonce: number } | null;
  className?: string;
}

export function ZiweiAiSection({
  birthDate, birthHour, gender, isVip, gate, requestPalace, className,
}: ZiweiAiSectionProps) {
  const chartKey = `${birthDate}|${birthHour}|${gender}`;
  const [reads, setReads] = useState<Record<string, string>>({});
  const [streaming, setStreaming] = useState<string | null>(null); // 宫名 或 '__full__'
  const [active, setActive] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReads(loadReads(chartKey));
    setActive(null);
    setError('');
  }, [chartKey]);

  const generate = async (palace: string | null) => {
    const key = palace ?? '__full__';
    setError('');
    if (reads[key]) {
      setActive((prev) => (prev === key ? null : key));
      return;
    }
    if (streaming) return;

    if (palace) track('ziwei_palace_ai_click', { palace });
    setStreaming(key);
    setActive(key);

    try {
      const res = await fetch('/api/ziwei/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          hour: Number(birthHour),
          gender,
          ...(palace ? { palace } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (gate.handle(res.status, body.code || body.error)) return;
        setError(body.message || body.error || '生成失败，请稍后再试');
        return;
      }

      // 缓存命中：整段文本
      if (res.headers.get('X-Source') === 'cache') {
        const text = await res.text();
        setReads((prev) => {
          const next = { ...prev, [key]: text };
          saveReads(chartKey, next);
          return next;
        });
        if (palace) track('ziwei_palace_ai_done', { palace, source: 'cache' });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('流式响应不可读');
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let streamError = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const obj = JSON.parse(dataStr);
              if (typeof obj.delta === 'string') {
                fullText += obj.delta;
                setReads((prev) => ({ ...prev, [key]: fullText }));
              }
              if (typeof obj.error === 'string') streamError = obj.error;
            } catch { /* skip */ }
          }
        }
      }

      if (streamError || !fullText.trim()) {
        setReads((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setError(streamError || '生成失败，请稍后再试');
      } else {
        setReads((prev) => {
          const next = { ...prev, [key]: fullText };
          saveReads(chartKey, next);
          return next;
        });
        if (palace) track('ziwei_palace_ai_done', { palace, source: 'stream' });
      }
    } catch {
      setError('网络异常，请稍后再试');
    } finally {
      setStreaming(null);
    }
  };

  // 外部（宫位详情面板）触发深读
  useEffect(() => {
    if (!requestPalace?.name) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    void generate(requestPalace.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPalace?.nonce]);

  const handleFullRead = () => {
    if (!isVip) {
      track('ziwei_full_paywall_show');
      gate.openQuota();
      return;
    }
    void generate(null);
  };

  const activeText = active ? reads[active] : undefined;

  const renderPalaceButton = (name: string, hook?: string, Icon?: typeof Briefcase) => {
    const generated = Boolean(reads[name]);
    const isStreaming = streaming === name;
    const isActive = active === name;
    return (
      <button
        key={name}
        type="button"
        onClick={() => generate(name)}
        disabled={Boolean(streaming) && !isStreaming}
        className={cn(
          'rounded-xl border p-3 text-left transition-all',
          isActive
            ? 'border-[#7E22CE]/40 bg-[#F3E8FF]/40'
            : 'border-[#1C1A16]/10 bg-white hover:border-[#1C1A16]/25 hover:-translate-y-0.5',
          Boolean(streaming) && !isStreaming && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0" style={{ background: '#F3E8FF' }}>
            {isStreaming ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
            ) : Icon ? (
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
            ) : (
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C1A16] flex items-center gap-1">
              {name}
              {generated && !isStreaming && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" strokeWidth={2} />}
            </p>
            <p className="text-[11px] text-[#1C1A16]/50 truncate">
              {isStreaming ? '正在解读…' : generated ? (isActive ? '点击收起' : '已生成 · 点击查看') : (hook ?? '深读此宫')}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      ref={rootRef}
      className={cn('bg-white rounded-2xl border border-[#1C1A16]/8 p-5 sm:p-6', className)}
      role="region"
      aria-label="AI 逐宫解读"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
        <h3 className="font-display text-lg font-semibold text-[#1C1A16]">AI 逐宫深读</h3>
      </div>
      <p className="text-xs text-[#1C1A16]/45 mb-4">
        点一个宫位，AI 只讲这件事（基于你的真实命盘与当前大限流年）· 免费每天 3 个宫位
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {STRONG_PALACES.map(({ name, hook, icon }) => renderPalaceButton(name, hook, icon))}
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-2.5 text-xs text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
      >
        {showMore ? '收起其他宫位 ↑' : '更多宫位（兄弟/子女/疾厄/交友/田宅/父母）↓'}
      </button>
      {showMore && (
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MORE_PALACES.map((name) => renderPalaceButton(name))}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {/* 当前解读内容 */}
      {active && (activeText || streaming === active) && (
        <div className="mt-3 rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4 space-y-3">
          {activeText ? (
            renderText(activeText)
          ) : (
            <div className="py-4 flex justify-center">
              <RefreshCw className="w-5 h-5 text-[#1C1A16]/40 animate-spin" />
            </div>
          )}
          {streaming === active && activeText && (
            <span className="inline-block w-1.5 h-4 bg-[#1C1A16] animate-pulse" />
          )}
        </div>
      )}

      {/* 全盘详批：VIP 专属 */}
      <button
        type="button"
        onClick={handleFullRead}
        disabled={Boolean(streaming)}
        className={cn(
          'mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors',
          isVip
            ? 'bg-brand-accent text-white hover:bg-brand-accent-hover'
            : 'border border-[#1C1A16]/15 bg-white text-[#1C1A16]/70 hover:border-[#1C1A16]/30',
          Boolean(streaming) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {streaming === '__full__' ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : isVip ? (
          <ScrollText className="w-4 h-4" />
        ) : (
          <Lock className="w-3.5 h-3.5" />
        )}
        全盘详批（六章节 · 十二宫总评）
        {!isVip && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: '#FBF1D0', color: '#B0870F' }}
          >
            会员专属
          </span>
        )}
      </button>
    </div>
  );
}

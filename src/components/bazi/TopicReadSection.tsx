'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Check, Coins, Compass, Heart, HeartPulse, Lock, RefreshCw, ScrollText, UserRound } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * 议题式 AI 解读（PRD-BAZI-V2 P0-A）：
 * 六大人生议题按需生成（免费 3 议题/日），替代一次性 2000 字长文；
 * 全盘详批（六板块长文）改为 VIP 专属入口。
 */

export type TopicKey = 'career' | 'wealth' | 'love' | 'health' | 'personality' | 'dayun';

const TOPICS: Array<{ key: TopicKey; label: string; hook: string; icon: typeof Briefcase }> = [
  { key: 'career', label: '事业攻守', hook: '现在该攻还是守', icon: Briefcase },
  { key: 'wealth', label: '财从何来', hook: '你的财是哪种财', icon: Coins },
  { key: 'love', label: '正缘何时', hook: '正缘画像与时段', icon: Heart },
  { key: 'health', label: '身体软肋', hook: '五行失衡养在哪', icon: HeartPulse },
  { key: 'personality', label: '性格底色', hook: '优势短板与人际', icon: UserRound },
  { key: 'dayun', label: '十年大势', hook: '这十年的主题', icon: Compass },
];

/** 议题结果本地留存（沿用「生成过不重复计费」体验；缓存命中服务端也不扣配额） */
function storageKey(cacheKey: string) {
  return `bazi_topics::${cacheKey}`;
}

function loadTopics(cacheKey: string | null): Partial<Record<TopicKey, string>> {
  if (!cacheKey || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(cacheKey));
    return raw ? (JSON.parse(raw) as Partial<Record<TopicKey, string>>) : {};
  } catch {
    return {};
  }
}

function saveTopics(cacheKey: string | null, texts: Partial<Record<TopicKey, string>>) {
  if (!cacheKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(cacheKey), JSON.stringify(texts));
  } catch {
    // 存储满等异常忽略：仅影响切回重复展示
  }
}

/** 去掉议题回答的【标题】行与 Markdown 残留，按段落渲染 */
function renderTopicText(text: string) {
  const cleaned = text
    .replace(/^【[^】]{1,12}】\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .trim();
  return cleaned.split(/\n{2,}/).map((para, i) => (
    <p key={i} className="text-sm leading-loose text-[#1C1A16]/80 whitespace-pre-wrap">
      {para.trim()}
    </p>
  ));
}

interface TopicReadSectionProps {
  /** 命盘缓存键：议题文本按盘留存；为空时不持久化 */
  cacheKey: string | null;
  /** 返回 /api/bazi/stream 请求体（不含 topic）；必要时父级先重算排盘。null = 准备失败 */
  ensurePayload: () => Promise<Record<string, unknown> | null>;
  isVip: boolean;
  /** 已有完整全盘长文（历史/VIP 缓存命中），此时不再显示全盘详批 CTA */
  hasFullAnalysis: boolean;
  /** VIP 全盘详批入口（父级走原全文流式） */
  onStartFullRead: () => void;
  onQuotaExceeded: () => void;
  onNeedAuth: (reason: { title: string; desc: string }) => void;
  onNeedVip: () => void;
}

export function TopicReadSection({
  cacheKey,
  ensurePayload,
  isVip,
  hasFullAnalysis,
  onStartFullRead,
  onQuotaExceeded,
  onNeedAuth,
  onNeedVip,
}: TopicReadSectionProps) {
  const [texts, setTexts] = useState<Partial<Record<TopicKey, string>>>({});
  const [streamingTopic, setStreamingTopic] = useState<TopicKey | null>(null);
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);
  const [error, setError] = useState('');

  // 切换命盘时载入该盘已生成的议题
  useEffect(() => {
    setTexts(loadTopics(cacheKey));
    setActiveTopic(null);
    setError('');
  }, [cacheKey]);

  const handleTopicClick = async (topic: TopicKey) => {
    setError('');
    // 已生成：切换展开/收起，不重复计费
    if (texts[topic]) {
      setActiveTopic((prev) => (prev === topic ? null : topic));
      return;
    }
    if (streamingTopic) return;

    track('bazi_topic_click', { topic });
    setStreamingTopic(topic);
    setActiveTopic(topic);

    try {
      const payload = await ensurePayload();
      if (!payload) {
        setError('命盘数据准备失败，请重新排盘后再试');
        return;
      }
      const response = await fetch('/api/bazi/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, topic }),
      });

      if (!response.ok) {
        let errCode = '';
        let errMsg = '';
        try {
          const data = await response.json();
          errCode = data?.error || '';
          errMsg = data?.message || '';
        } catch {}
        if (response.status === 403 && errCode === 'QUOTA_EXCEEDED') {
          onQuotaExceeded();
          return;
        }
        if (response.status === 429 && errCode === 'GUEST_LIMIT_REACHED') {
          onNeedAuth({
            title: '今日免费议题已用完',
            desc: '游客每天可免费解读 1 个议题。登录后每天免费 3 个议题，并可保存命盘随时查看。',
          });
          return;
        }
        setError(errMsg || '生成失败，请稍后再试');
        return;
      }

      // 缓存命中：整段文本直接返回
      if (response.headers.get('X-Source') === 'cache') {
        const text = await response.text();
        setTexts((prev) => {
          const next = { ...prev, [topic]: text };
          saveTopics(cacheKey, next);
          return next;
        });
        track('bazi_topic_done', { topic, source: 'cache' });
        return;
      }

      // SSE 流式
      const reader = response.body?.getReader();
      if (!reader) throw new Error('流式响应不可读');
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

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
                setTexts((prev) => ({ ...prev, [topic]: fullText }));
              }
              if (obj.fallback && typeof obj.text === 'string') {
                fullText = obj.text;
                setTexts((prev) => ({ ...prev, [topic]: fullText }));
              }
            } catch {
              // skip
            }
          }
        }
      }

      if (fullText.trim()) {
        setTexts((prev) => {
          const next = { ...prev, [topic]: fullText };
          saveTopics(cacheKey, next);
          return next;
        });
        track('bazi_topic_done', { topic, source: 'stream' });
      } else {
        setTexts((prev) => {
          const next = { ...prev };
          delete next[topic];
          return next;
        });
        setError('生成失败，请稍后再试（本次不计次数）');
      }
    } catch {
      setError('网络异常，请稍后再试');
    } finally {
      setStreamingTopic(null);
    }
  };

  const handleFullReadClick = () => {
    if (isVip) {
      onStartFullRead();
      return;
    }
    track('bazi_full_paywall_show');
    onNeedVip();
  };

  const activeText = activeTopic ? texts[activeTopic] : undefined;
  const activeMeta = TOPICS.find((t) => t.key === activeTopic);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-[#1C1A16]">想先看哪个问题？</p>
        <p className="text-[11px] text-[#1C1A16]/45">点一个议题，AI 只讲这件事 · 免费每天 3 个</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TOPICS.map(({ key, label, hook, icon: Icon }) => {
          const generated = Boolean(texts[key]);
          const isStreaming = streamingTopic === key;
          const isActive = activeTopic === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTopicClick(key)}
              disabled={Boolean(streamingTopic) && !isStreaming}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? 'border-[#1D4ED8]/40 bg-[#DBEAFE]/30'
                  : 'border-[#1C1A16]/10 bg-white hover:border-[#1C1A16]/25 hover:-translate-y-0.5'
              } ${Boolean(streamingTopic) && !isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                  style={{ background: '#DBEAFE' }}
                >
                  {isStreaming ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
                  ) : (
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1C1A16] flex items-center gap-1">
                    {label}
                    {generated && !isStreaming && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                    )}
                  </p>
                  <p className="text-[11px] text-[#1C1A16]/50 truncate">
                    {isStreaming ? '正在解读…' : generated ? (isActive ? '点击收起' : '已生成 · 点击查看') : hook}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {/* 当前议题内容 */}
      {activeTopic && (activeText || streamingTopic === activeTopic) && (
        <div className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4 space-y-2">
          <p className="text-xs font-medium" style={{ color: '#1D4ED8' }}>
            【{activeMeta?.label}】
          </p>
          {activeText ? (
            <div className="space-y-2">{renderTopicText(activeText)}</div>
          ) : (
            <div className="py-4 flex justify-center">
              <RefreshCw className="w-5 h-5 text-[#1C1A16]/40 animate-spin" />
            </div>
          )}
          {streamingTopic === activeTopic && activeText && (
            <span className="inline-block w-1.5 h-4 bg-[#1C1A16] animate-pulse" />
          )}
        </div>
      )}

      {/* 全盘详批：VIP 专属长文 */}
      {!hasFullAnalysis && (
        <button
          type="button"
          onClick={handleFullReadClick}
          className={`mx-auto flex w-full sm:w-auto sm:px-8 items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
            isVip
              ? 'bg-brand-accent text-white hover:bg-brand-accent-hover'
              : 'border border-[#1C1A16]/15 bg-white text-[#1C1A16]/70 hover:border-[#1C1A16]/30'
          }`}
        >
          {isVip ? (
            <ScrollText className="w-4 h-4" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          全盘详批（六板块 2000 字长文）
          {!isVip && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: '#FBF1D0', color: '#B0870F' }}
            >
              会员专属
            </span>
          )}
        </button>
      )}
    </div>
  );
}

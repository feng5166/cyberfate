'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Clock, Send, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { OracleLoading } from '@/components/ui/OracleLoading';
import type {
  BaziTrait,
  MingGeInfo,
  PillarRecord,
  WuxingCount,
} from '@/lib/bazi/types';

const FAVORITES_KEY = 'cyberfate_bazi_chat_favorites';

const PRESET_QUESTIONS = [
  '今年哪几个月财运最旺？',
  '我适合和什么生肖的人结婚？',
  '我的事业转折点在哪一年？',
  '我的命格最大的优势是什么？',
];

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  streaming: boolean;
  favorited: boolean;
  timestamp: number;
  thinkingSteps: string[];
  thinkingDone: boolean;
  thinkingExpanded: boolean;
}

interface FavoriteRecord {
  question: string;
  answer: string;
  timestamp: number;
}

interface BaziChatSectionProps {
  baziData: {
    pillars: PillarRecord;
    wuxing: WuxingCount;
    aiAnalysis: string;
    mingGe?: MingGeInfo;
    traits?: BaziTrait[];
  };
  isLoggedIn: boolean;
  isVip: boolean;
}

const cardClass =
  'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white hover:shadow-card-hover transition-shadow duration-300';

function loadFavorites(): FavoriteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(list: FavoriteRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function ThinkingSteps({
  steps,
  done,
  expanded,
  onToggle,
}: {
  steps: string[];
  done: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (steps.length === 0) return null;
  return (
    <div className="mb-3 rounded-xl border border-[#1C1A16]/8 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#FAF9F6] transition-colors"
      >
        <Wrench className="w-3.5 h-3.5 text-[#1C1A16]/40 flex-shrink-0" />
        <span className="text-xs text-[#1C1A16]/60 flex-1">
          {done ? `分析完成，共 ${steps.length} 次查询` : `分析中，已完成 ${steps.length} 步...`}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#1C1A16]/30" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#1C1A16]/30" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#1C1A16]/55">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BaziChatSection({ baziData, isLoggedIn, isVip }: BaziChatSectionProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const THINKING_STEPS = [
    '查询今天日期',
    '分析十神',
    '分析刑冲会合',
    '查询神煞',
    '查询大运',
    `查询流年 ${currentYear}年`,
    `查询流月 ${currentYear}年 ${currentMonth}月`,
  ];

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const favoriteKeySet = useMemo(() => {
    return new Set(favorites.map(item => `${item.question}::${item.answer}`));
  }, [favorites]);

  const toggleFavorite = (msg: ChatMessage) => {
    const key = `${msg.question}::${msg.answer}`;
    const exists = favoriteKeySet.has(key);
    let next: FavoriteRecord[];
    if (exists) {
      next = favorites.filter(item => `${item.question}::${item.answer}` !== key);
    } else {
      next = [
        { question: msg.question, answer: msg.answer, timestamp: Date.now() },
        ...favorites,
      ].slice(0, 50);
    }
    setFavorites(next);
    saveFavorites(next);
    setMessages(prev =>
      prev.map(item => (item.id === msg.id ? { ...item, favorited: !exists } : item))
    );
  };

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    if (submitting) return;

    if (!isLoggedIn) {
      setToast('请登录后使用');
      return;
    }
    if (!isVip) {
      setShowSubModal(true);
      return;
    }
    if (trimmed.length > 200) {
      setToast('问题不得超过200字');
      return;
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newMsg: ChatMessage = {
      id,
      question: trimmed,
      answer: '',
      streaming: true,
      favorited: false,
      timestamp: Date.now(),
      thinkingSteps: [],
      thinkingDone: false,
      thinkingExpanded: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setSubmitting(true);

    THINKING_STEPS.forEach((step, index) => {
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === id
              ? { ...m, thinkingSteps: THINKING_STEPS.slice(0, index + 1) }
              : m
          )
        );
        if (index === THINKING_STEPS.length - 1) {
          setTimeout(() => {
            setMessages(prev =>
              prev.map(m => (m.id === id ? { ...m, thinkingDone: true } : m))
            );
          }, 300);
        }
      }, index * 400);
    });

    try {
      const res = await fetch('/api/bazi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baziData, question: trimmed }),
      });

      if (res.status === 401) {
        setToast('请登录后使用');
        setMessages(prev => prev.filter(m => m.id !== id));
        return;
      }
      if (res.status === 403) {
        setShowSubModal(true);
        setMessages(prev => prev.filter(m => m.id !== id));
        return;
      }
      if (!res.ok || !res.body) {
        let errMsg = '服务暂时不可用，请稍后再试';
        try {
          const data = await res.json();
          if (data?.detail) errMsg = `${data.error}: ${data.detail}`;
          else if (data?.error) errMsg = data.error;
        } catch {}
        setMessages(prev =>
          prev.map(m =>
            m.id === id ? { ...m, answer: errMsg, streaming: false } : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.content) {
              acc += json.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === id
                    ? { ...m, answer: acc, thinkingExpanded: false }
                    : m
                )
              );
            }
          } catch {}
        }
      }

      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, answer: '网络错误，请稍后再试', streaming: false }
            : m
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(input);
  };

  return (
    <Card className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">AI 八字问答</h2>
          <p className="text-xs text-[#1C1A16]/45 mt-1">基于您的命盘智能问答 · 仅供参考</p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#1C1A16]/15 text-[#1C1A16]/70 hover:bg-[#FAF9F6] transition-colors"
          title="历史问答"
          aria-label="历史问答"
        >
          <Clock className="w-4 h-4" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-medium">
              {favorites.length > 99 ? '99+' : favorites.length}
            </span>
          )}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PRESET_QUESTIONS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => handleAsk(q)}
            disabled={submitting}
            className="rounded-lg border border-[#1C1A16]/15 px-4 py-2.5 text-sm text-[#1C1A16]/80 text-left hover:bg-[#FAF9F6] disabled:opacity-50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div
          ref={listRef}
          className="mt-5 max-h-[480px] overflow-y-auto space-y-4 pr-1"
        >
          {messages.map(msg => {
            const key = `${msg.question}::${msg.answer}`;
            const isFav = favoriteKeySet.has(key);
            return (
              <div key={msg.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[#1C1A16] text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed">
                    {msg.question}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-[#FAF9F6] text-[#1C1A16] text-sm rounded-2xl rounded-tl-sm px-4 py-3 leading-relaxed">
                    {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                      <ThinkingSteps
                        steps={msg.thinkingSteps}
                        done={msg.thinkingDone ?? false}
                        expanded={msg.thinkingExpanded ?? true}
                        onToggle={() =>
                          setMessages(prev =>
                            prev.map(m =>
                              m.id === msg.id
                                ? { ...m, thinkingExpanded: !m.thinkingExpanded }
                                : m
                            )
                          )
                        }
                      />
                    )}
                    <div className="whitespace-pre-wrap">
                      {msg.streaming && !msg.answer ? (
                        <OracleLoading />
                      ) : (
                        <>
                          {msg.answer}
                          {msg.streaming && msg.answer && (
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                          )}
                        </>
                      )}
                    </div>
                    {!msg.streaming && msg.answer && (
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(msg)}
                          className="inline-flex items-center text-xs text-[#1C1A16]/50 hover:text-[#C2762B] transition-colors"
                          title={isFav ? '取消收藏' : '收藏'}
                          aria-label={isFav ? '取消收藏' : '收藏'}
                        >
                          {isFav ? (
                            <BookmarkCheck className="w-4 h-4 text-[#C2762B]" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入你的问题，如：我今年适合换工作吗？"
          maxLength={200}
          disabled={submitting}
          className="flex-1 h-11 rounded-xl border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#C2762B] hover:bg-[#A86425] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 mr-1.5" />
          提问
        </button>
      </form>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1C1A16] text-white text-sm rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {showSubModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowSubModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-[#1C1A16]">解锁 AI 八字问答</h3>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="text-[#1C1A16]/40 hover:text-[#1C1A16]"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
              AI 八字问答是会员专属功能。开通会员后可基于您的命盘进行无限次智能问答。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="flex-1 h-10 rounded-xl border border-[#1C1A16]/15 text-sm text-[#1C1A16] hover:bg-[#FAF9F6] transition-colors"
              >
                稍后再说
              </button>
              <Link
                href="/pricing"
                className="flex-1 h-10 inline-flex items-center justify-center rounded-xl bg-[#C2762B] hover:bg-[#A86425] text-white text-sm font-medium transition-colors"
              >
                立即开通
              </Link>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C1A16]/8">
              <h3 className="text-base font-semibold text-[#1C1A16]">历史问答</h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-[#1C1A16]/40 hover:text-[#1C1A16]"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {favorites.length === 0 ? (
                <p className="text-sm text-[#1C1A16]/50 text-center py-8">
                  暂无收藏的问答，点击回答右下角的书签即可收藏。
                </p>
              ) : (
                favorites.map(item => (
                  <div
                    key={`${item.timestamp}_${item.question.slice(0, 4)}`}
                    className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4"
                  >
                    <p className="text-sm font-medium text-[#1C1A16] mb-2">
                      Q：{item.question}
                    </p>
                    <p className="text-sm text-[#1C1A16]/75 leading-relaxed whitespace-pre-wrap">
                      {item.answer}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-[#1C1A16]/40">
                        {new Date(item.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = favorites.filter(
                            f =>
                              !(
                                f.question === item.question &&
                                f.answer === item.answer
                              )
                          );
                          setFavorites(next);
                          saveFavorites(next);
                          setMessages(prev =>
                            prev.map(m =>
                              m.question === item.question &&
                              m.answer === item.answer
                                ? { ...m, favorited: false }
                                : m
                            )
                          );
                        }}
                        className="text-xs text-[#1C1A16]/50 hover:text-rose-500"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

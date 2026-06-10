'use client';

import dynamic from 'next/dynamic';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { OracleLoading } from '@/components/ui/OracleLoading';

const Footer = dynamic(() => import('@/components/layout/Footer').then(m => m.Footer), { ssr: false });
const AiDisclaimer = dynamic(() => import('@/components/ui/AiDisclaimer').then(m => m.AiDisclaimer), { ssr: false });

type Method = 'time' | 'number' | 'random' | 'manual';

interface GuaMeta {
  name: string;
  symbol: string;
  meaning: string;
  lines: [number, number, number];
}

interface GuaPair {
  upper: GuaMeta;
  lower: GuaMeta;
  gua: string;
  guaName: string;
  guaSymbol: string;
}

interface MeihuaDrawResult {
  gua: string;
  guaName: string;
  upper?: string;
  lower?: string;
  changedGua?: string;
  changedGuaName?: string;
  movingLine?: number;
  primary?: GuaPair;
  changed?: GuaPair;
  analysis: string;
  guaCi?: string;
  _source?: string;
  error?: string;
}

interface MeihuaDecisionResult {
  overallAdvice: string;
  stance: 'go' | 'stop' | 'wait';
  favorable: string[];
  cautions: string[];
  nextSteps: string[];
  insights: {
    thinkingReference: string;
    guaAnalysis: string;
    timingReference: string;
  };
  _source?: string;
  error?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const METHOD_OPTIONS: Array<{ value: Method; label: string }> = [
  { value: 'time', label: '时间起卦' },
  { value: 'number', label: '数字起卦' },
  { value: 'random', label: '随机数起卦' },
  { value: 'manual', label: '手动起卦' },
];

const AI_INSIGHT_ITEMS = [
  {
    icon: '◎',
    title: '思考参考',
    desc: '从传统易学角度获取参考观点，帮助您从多维度思考重要事项。',
  },
  {
    icon: '❋',
    title: 'AI 观察',
    desc: '运用算法结合现代心理学视角，观察传统符号的文化内涵。',
  },
  {
    icon: '✦',
    title: '时机思考',
    desc: '不仅思考做什么，还可以参考不同时机的考量因素。',
  },
];

const FEATURE_ITEMS = [
  {
    icon: '🤖',
    title: '多角度观察',
    desc: '获取超越简单是/否的多层次观察，提供文化背景和不同视角。',
  },
  {
    icon: '✦',
    title: '个性化参考',
    desc: '接收基于您的问题和当前情况的参考观点。',
  },
  {
    icon: '💬',
    title: '清晰表达',
    desc: '将传统占卜符号的文化内涵转化为易于理解的参考信息。',
  },
  {
    icon: '❋',
    title: '模式观察',
    desc: '我们的 AI 系统尝试观察不同的模式和关联，供您参考思考。',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '梅花易数的参考价值如何？',
    answer:
      '梅花易数是经过几个世纪传承的文化遗产，基于传统哲学和文化智慧提供思考角度。我们的 AI 技术帮助更好地呈现这些传统观点。',
  },
  {
    question: 'AI 如何辅助传统占卜？',
    answer:
      '我们的 AI 帮助观察和整理传统符号的文化内涵，结合现代视角提供多元化的参考观点，最终的理解和决策完全在您手中。',
  },
  {
    question: '哪些类型的问题适合参考这个系统？',
    answer:
      '具体、聚焦的思考或情境问题可能获得更有针对性的参考。关于一般生活方向的开放式问题可能会收到更宽泛的思考角度。',
  },
];

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '暂无卦辞。';
  const sentence = normalized
    .split(/[。！？\n]/)
    .map((item) => item.trim())
    .find(Boolean);
  return sentence ? `${sentence}。` : normalized;
}

function HexagramDiagram({ upper, lower, movingLine }: {
  upper: { lines: [number, number, number] };
  lower: { lines: [number, number, number] };
  movingLine?: number;
}) {
  const allLines = [...lower.lines, ...upper.lines];
  return (
    <div className="flex flex-col-reverse gap-2 w-28">
      {allLines.map((yao, i) => {
        const isMoving = movingLine !== undefined && (i + 1) === movingLine;
        const isYin = yao === 0;
        return (
          <div key={i} className={`flex items-center gap-1.5 ${isMoving ? 'opacity-60' : ''}`}>
            {isYin ? (
              <>
                <div className={`h-3 flex-1 rounded-sm ${isMoving ? 'bg-amber-400' : 'bg-[#1C1A16]'}`} />
                <div className="h-3 w-3 flex-shrink-0" />
                <div className={`h-3 flex-1 rounded-sm ${isMoving ? 'bg-amber-400' : 'bg-[#1C1A16]'}`} />
              </>
            ) : (
              <div className={`h-3 w-full rounded-sm ${isMoving ? 'bg-amber-400' : 'bg-[#1C1A16]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MeihuaPage() {
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState<Method>('time');
  const [numbers, setNumbers] = useState({ num1: '', num2: '' });
  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MeihuaDrawResult | null>(null);
  const [decision, setDecision] = useState<MeihuaDecisionResult | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const isQuestionMode = Boolean(question.trim());

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setDecision(null);

    if (method === 'manual') {
      setError('手动起卦即将上线，请先使用时间起卦或数字起卦。');
      return;
    }

    if (method === 'number' && (!numbers.num1.trim() || !numbers.num2.trim())) {
      setError('数字起卦请先输入两个数字。');
      return;
    }

    setLoading(true);

    let submitMethod: Method = method;
    let submitNumbers = numbers;
    if (method === 'random') {
      const rand1 = Math.floor(Math.random() * 100) + 1;
      const rand2 = Math.floor(Math.random() * 100) + 1;
      submitMethod = 'number';
      submitNumbers = { num1: String(rand1), num2: String(rand2) };
    }

    try {
      const drawRes = await fetch('/api/meihua/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: submitMethod, numbers: submitNumbers }),
      });

      if (!drawRes.ok || !drawRes.body) {
        let errMsg = '起卦失败，请稍后重试。';
        try {
          const data = await drawRes.json();
          if (data?.error) errMsg = data.error;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = drawRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaSet = false;
      let acc = '';
      let finalDraw: MeihuaDrawResult | null = null;

      setStreaming(true);

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
            if (json.meta && !metaSet) {
              metaSet = true;
              setLoading(false);
              const initial: MeihuaDrawResult = {
                ...json.meta,
                analysis: '',
                guaCi: json.meta.guaCi || '',
              };
              finalDraw = initial;
              setResult(initial);
            } else if (json.content) {
              acc += json.content;
              if (finalDraw) {
                const current: MeihuaDrawResult = finalDraw;
                finalDraw = { ...current, analysis: acc };
              }
              setResult((prev) => (prev ? { ...prev, analysis: acc } : prev));
            }
          } catch {}
        }
      }

      setStreaming(false);

      if (!finalDraw) {
        throw new Error('起卦失败，请稍后重试。');
      }

      finalDraw.guaCi = finalDraw.guaCi || firstSentence(finalDraw.analysis);
      setResult(finalDraw);

      if (isQuestionMode) {
        setDecisionLoading(true);
        try {
          const decideRes = await fetch('/api/meihua/decide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question.trim(), draw: finalDraw }),
          });

          if (!decideRes.ok || !decideRes.body) {
            let errMsg = '已完成起卦，AI 决策建议暂不可用。';
            try {
              const data = await decideRes.json();
              if (data?.error) errMsg = data.error;
            } catch {}
            setError(errMsg);
            return;
          }

          const decideReader = decideRes.body.getReader();
          const decideDecoder = new TextDecoder();
          let decideBuf = '';
          let decideMeta: MeihuaDecisionResult | null = null;
          let decideNarrative = '';

          while (true) {
            const { done, value } = await decideReader.read();
            if (done) break;
            decideBuf += decideDecoder.decode(value, { stream: true });
            const lines = decideBuf.split('\n');
            decideBuf = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                if (json.meta && !decideMeta) {
                  decideMeta = json.meta as MeihuaDecisionResult;
                  setDecision({ ...decideMeta, overallAdvice: '' });
                } else if (json.content) {
                  decideNarrative += json.content;
                  if (decideMeta) {
                    setDecision({ ...decideMeta, overallAdvice: decideNarrative });
                  }
                }
              } catch {}
            }
          }

          if (decideMeta) {
            setDecision({ ...decideMeta, overallAdvice: decideNarrative });
          }
        } finally {
          setDecisionLoading(false);
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '起卦失败，请稍后重试。');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const triggerDecide = async () => {
    if (!result || !isQuestionMode) return;
    setDecisionLoading(true);
    try {
      const decideRes = await fetch('/api/meihua/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), draw: result }),
      });
      if (!decideRes.ok || !decideRes.body) {
        let errMsg = '已完成起卦，AI 决策建议暂不可用。';
        try { const d = await decideRes.json(); if (d?.error) errMsg = d.error; } catch {}
        setError(errMsg);
        return;
      }
      const decideReader = decideRes.body.getReader();
      const decideDecoder = new TextDecoder();
      let decideBuf = '';
      let decideMeta: MeihuaDecisionResult | null = null;
      let decideNarrative = '';
      while (true) {
        const { done, value } = await decideReader.read();
        if (done) break;
        decideBuf += decideDecoder.decode(value, { stream: true });
        const lines = decideBuf.split('\n');
        decideBuf = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            if (json.meta && !decideMeta) {
              decideMeta = json.meta as MeihuaDecisionResult;
              setDecision({ ...decideMeta, overallAdvice: '' });
            } else if (json.content) {
              decideNarrative += json.content;
              if (decideMeta) setDecision({ ...decideMeta, overallAdvice: decideNarrative });
            }
          } catch {}
        }
      }
      if (decideMeta) setDecision({ ...decideMeta, overallAdvice: decideNarrative });
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%231C1A16' stroke-width='1'/%3E%3Cpath d='M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 5' fill='%231C1A16'/%3E%3Cpath d='M50 95 A45 45 0 0 1 50 5 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 95' fill='%23FFFFFF'/%3E%3Ccircle cx='50' cy='27' r='5' fill='%23FFFFFF' stroke='%231C1A16' stroke-width='1'/%3E%3Ccircle cx='50' cy='73' r='5' fill='%231C1A16'/%3E%3C/svg%3E\")",
          backgroundSize: '140px 140px',
          backgroundRepeat: 'repeat',
        }}
      />

      <main className="px-4 pb-20 md:pb-24">
        <section className="mx-auto max-w-4xl pt-24 pb-12 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(36px,5vw,56px)] leading-tight text-[#1C1A16]">
            梅花易数 · 每日决策
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-[#1C1A16]/70 md:text-base">
            结合古老的梅花易数和现代 AI 分析，为您的日常决策提供参考。
          </p>
        </section>

        <section className="mx-auto max-w-4xl animate-fadeIn">
          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 shadow-none transition-shadow duration-300 hover:shadow-card-hover md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-[#1C1A16]">提出您的决策问题</h2>
              <Clock className="h-4 w-4 text-[#1C1A16]/40 cursor-pointer hover:text-[#1C1A16]/60" />
            </div>
            <p className="mt-2 text-xs text-[#1C1A16]/60 md:text-sm">
              请输入一个明确的问题，系统将自动为您起卦
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我是否应该接受这个工作机会？"
                className="w-full rounded-xl border border-gray-300 p-4 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/45 focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-1">
                <span className="mr-2 text-xs text-[#1C1A16]/60">起卦方式</span>
                {METHOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMethod(option.value)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      method === option.value
                        ? 'bg-[#1C1A16] text-white font-medium'
                        : 'text-[#1C1A16]/60 hover:text-[#1C1A16]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#1C1A16]/45">
                <Info className="h-3 w-3" />
                <span className="cursor-pointer hover:text-[#1C1A16]/70">查看起卦规则</span>
              </div>
            </div>

            {method === 'number' && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="number"
                  value={numbers.num1}
                  onChange={(e) => setNumbers((prev) => ({ ...prev, num1: e.target.value }))}
                  className="h-11 rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10"
                  placeholder="第一个数字"
                />
                <input
                  type="number"
                  value={numbers.num2}
                  onChange={(e) => setNumbers((prev) => ({ ...prev, num2: e.target.value }))}
                  className="h-11 rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10"
                  placeholder="第二个数字"
                />
              </div>
            )}

            {method === 'manual' && (
              <div className="mt-4 rounded-xl border border-dashed border-[#1C1A16]/20 bg-[#FAF9F6] p-4 text-sm text-[#1C1A16]/60">
                手动起卦即将上线
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || streaming || decisionLoading || !question.trim()}
              className="mt-5 flex h-[44px] w-full items-center justify-center rounded-xl bg-gray-200 text-sm font-medium text-[#1C1A16] transition-all hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading || streaming || decisionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在解卦...
                </>
              ) : (
                '起卦解析 ✦'
              )}
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {loading && !result && (
              <div className="mt-5 flex justify-center">
                <OracleLoading />
              </div>
            )}
          </div>
        </section>

        {result && (
          <section className="mx-auto mt-8 max-w-4xl animate-fadeIn">
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 shadow-none">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-lg font-bold text-[#1C1A16]">卦象分析结果</h3>
                  <p className="text-xs text-[#1C1A16]/45 mt-0.5">
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    &nbsp;·&nbsp;
                    {METHOD_OPTIONS.find(m => m.value === method)?.label ?? '时间起卦'}
                  </p>
                </div>
                <button
                  onClick={() => { setResult(null); setDecision(null); setError(''); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                  title="清除结果"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>

              {question.trim() && (
                <div className="mt-4 rounded-xl bg-[#F5F5F3] px-4 py-3">
                  <p className="text-xs font-medium text-[#1C1A16]/50 mb-1">您的问题：</p>
                  <p className="text-sm text-[#1C1A16]">{question.trim()}</p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-[#1C1A16] px-3 py-0.5 text-xs font-medium text-white">本卦</span>
                  {result.primary ? (
                    <HexagramDiagram
                      upper={result.primary.upper}
                      lower={result.primary.lower}
                      movingLine={result.movingLine}
                    />
                  ) : (
                    <div className="text-2xl">{(result.gua || '').replace('\n','')}</div>
                  )}
                  <p className="text-sm font-semibold text-[#1C1A16]">{result.primary?.guaName || result.guaName || ''}</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-[#1C1A16]/20 px-3 py-0.5 text-xs font-medium text-[#1C1A16]/70">变卦</span>
                  {result.changed ? (
                    <HexagramDiagram
                      upper={result.changed.upper}
                      lower={result.changed.lower}
                    />
                  ) : (
                    <div className="text-2xl">{((result.changedGua || result.gua) || '').replace('\n','')}</div>
                  )}
                  <p className="text-sm font-semibold text-[#1C1A16]/70">{result.changed?.guaName || result.changedGuaName || result.guaName || ''}</p>
                </div>
              </div>

              {result.movingLine !== undefined && (
                <div className="mt-5 rounded-xl border border-[#1C1A16]/8 bg-[#FAFAF8] px-4 py-3">
                  <p className="text-xs font-medium text-[#1C1A16]/50 mb-2">● 变爻位置</p>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#1C1A16]/10 px-3 py-1.5 text-sm text-[#1C1A16]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1C1A16] text-xs text-white font-bold">{result.movingLine}</span>
                    发生变化
                  </span>
                </div>
              )}

              <div className="mt-6">
                {decisionLoading && !decision ? (
                  <div className="flex justify-center py-4">
                    <OracleLoading />
                  </div>
                ) : !decision && isQuestionMode ? (
                  <button
                    onClick={triggerDecide}
                    className="w-full rounded-xl bg-[#1C1A16] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1C1A16]/85"
                  >
                    分析卦象含义
                  </button>
                ) : null}
              </div>
            </div>

            {decision && (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    { icon: '🧠', title: '思考参考', content: decision.insights?.thinkingReference },
                    { icon: '✦', title: '卦象分析', content: decision.insights?.guaAnalysis },
                    { icon: '⏰', title: '时机参考', content: decision.insights?.timingReference },
                  ].filter(item => item.content).map(item => (
                    <div key={item.title} className="rounded-xl bg-white border border-[#1C1A16]/8 p-5">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="mt-3 text-sm font-bold text-[#1C1A16]">{item.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/70">{item.content}</p>
                    </div>
                  ))}
                </div>

                {isQuestionMode && decision.overallAdvice && (
                  <div className="mt-4 rounded-2xl bg-white border border-[#1C1A16]/8 p-6">
                    <h3 className="text-base font-bold text-[#1C1A16]">决策建议</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/85 whitespace-pre-wrap">{decision.overallAdvice}</p>
                    {decision.favorable && decision.favorable.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-green-700">✓ 有利因素</h4>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-green-700">
                          {decision.favorable.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ol>
                      </div>
                    )}
                    {decision.cautions && decision.cautions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-amber-700">⚠ 需要注意</h4>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-amber-700">
                          {decision.cautions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ol>
                      </div>
                    )}
                    {decision.nextSteps && decision.nextSteps.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-blue-700">💡 下一步行动</h4>
                        <div className="mt-2 space-y-2 text-sm leading-relaxed text-blue-700">
                          {decision.nextSteps.map((item: string, i: number) => <p key={i}>{item}</p>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-white border border-[#1C1A16]/8 p-6">
                  <h3 className="text-base font-bold text-[#1C1A16]">{isQuestionMode ? '基础卦象解读' : '卦象解读'}</h3>
                  <p className="mt-1 text-xs text-[#1C1A16]/45 mb-3">AI 综合分析 · 仅供参考</p>
                  {streaming && !result.analysis ? (
                    <OracleLoading />
                  ) : (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1C1A16]/75">
                      {result.analysis}
                      {streaming && result.analysis && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                      )}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        <section className="mx-auto mt-12 max-w-4xl animate-fadeIn">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16] mb-6">AI 辅助观察</h2>
            <p className="mt-2 text-base text-[#1C1A16]/60 max-w-2xl mx-auto">我们的系统将古老的占卜文化与现代 AI 技术结合，为您的思考提供不同角度的参考观点。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {AI_INSIGHT_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center rounded-2xl border border-[#1C1A16]/10 bg-white p-8 py-10 text-center shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl mb-6">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1C1A16] mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#1C1A16]/65">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16] text-center">特色功能</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURE_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#FAF9F6] text-xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1A16]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#1C1A16]/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-4xl pb-4 animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16] text-center">常见问题</h2>
          <div className="mt-8 space-y-5">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-2xl border border-[#1C1A16]/10 bg-white px-6 py-6">
                <p className="flex items-start gap-2 text-base font-medium text-[#1C1A16]">
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#1C1A16]/30 text-sm text-[#1C1A16]/60">?</span>
                  {item.question}
                </p>
                <p className="mt-3 text-sm leading-loose text-[#1C1A16]/70">{item.answer}</p>
              </div>
            ))}
          </div>

          <AiDisclaimer />
          <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-white p-3 text-center text-xs text-[#6B7280]">
            ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。命运掌握在自己手中，请理性对待。
          </div>
        </section>

        <div className="hidden" data-version="20260407-meihua-v3"></div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { Footer } from '@/components/layout/Footer';
import { OracleLoading } from '@/components/ui/OracleLoading';
import { inputRecipe } from '@/components/ui';
import { Share2, X, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { track } from '@/lib/analytics';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';

const SAMPLE_PROMPTS = [
  '创业还是留在大公司更适合我？',
  '对方不喜欢我，我该如何让自己放下？',
  '为何我在社交场合难以做真实的自己？',
  '这段感情还值得继续吗？',
  '我现在的职业方向对吗？',
  '如何走出当前的低谷期？',
];

type TarotSpread = 'three' | 'celtic' | 'moonlight' | 'mirror' | 'relationship';

const THREE_POSITIONS = ['过去', '现在', '未来'];

const CELTIC_POSITIONS = [
  '1现状',
  '2挑战',
  '3意识',
  '4根源',
  '5希望/恐惧',
  '6近期发展',
  '7可能结果',
  '8外部环境',
  '9心态信念',
  '10最终结局',
];

const MOONLIGHT_POSITIONS = ['身心灵', '潜意识', '指引'];

const MIRROR_POSITIONS = ['现状', '阻碍', '建议', '风险', 'Outcome'];

const RELATIONSHIP_POSITIONS = ['你的感受', '对方感受', '关系基础', '当前障碍', '关系走向'];

const CELTIC_DESKTOP_LAYOUT: { col: number; row: number }[] = [
  { col: 1, row: 4 }, // 1现状
  { col: 2, row: 2 }, // 2挑战
  { col: 2, row: 4 }, // 3意识
  { col: 3, row: 4 }, // 4根源
  { col: 2, row: 3 }, // 5希望/恐惧
  { col: 2, row: 1 }, // 6近期发展
  { col: 5, row: 4 }, // 7可能结果
  { col: 3, row: 2 }, // 8外部环境 → 修正为 col3,row4 → 按需求 col3,row4 已被4占用
  { col: 4, row: 2 }, // 9心态信念
  { col: 1, row: 2 }, // 10最终结局
];

const MODES = [
  { id: 'classic' as const, icon: '◉', name: '经典', desc: '3张牌·过去/现在/未来,新手首选', tooltip: '3张牌过去/现在/未来,新手首选' },
  { id: 'celtic' as const, icon: '✝', name: '凯尔特十字', desc: '10张牌·全面深度分析,会员专属', tooltip: '10张牌深度解读,全面分析人生各维度' },
  { id: 'moonlight' as const, icon: '☽', name: '月光', desc: '3张牌·柔和内省,适合情感探索', tooltip: '温柔内省风格,适合情感/睡前探索' },
  { id: 'mirror' as const, icon: '✦', name: '镜像', desc: '5张牌·多角度透视,复杂决策专用', tooltip: '5张多角度深度分析,复杂决策专用' },
  { id: 'relationship' as const, icon: '♡', name: '关系牌阵', desc: '5张牌·双方视角,适合感情与关系探索', tooltip: '从你和对方双视角解读关系现状与走向' },
];

type ModeId = (typeof MODES)[number]['id'];
type Step = 'question' | 'drawing' | 'drawn' | 'loading' | 'result';

const MODE_TO_SPREAD: Record<ModeId, TarotSpread> = {
  classic: 'three',
  celtic: 'celtic',
  moonlight: 'moonlight',
  mirror: 'mirror',
  relationship: 'relationship',
};

function getPositions(spread: TarotSpread): string[] {
  switch (spread) {
    case 'celtic':
      return CELTIC_POSITIONS;
    case 'moonlight':
      return MOONLIGHT_POSITIONS;
    case 'mirror':
      return MIRROR_POSITIONS;
    case 'relationship':
      return RELATIONSHIP_POSITIONS;
    default:
      return THREE_POSITIONS;
  }
}

interface TarotCard {
  id: string | number;
  name_en: string;
  name_zh: string;
  keywords: string[];
  orientation: 'upright' | 'reversed';
  image_url: string;
  upright: string;
  reversed: string;
  position?: string;
  meaning: string;
}

interface TarotDrawResult {
  spread: string;
  cards: TarotCard[];
  reading: string;
  caution: string;
  _source?: string;
  _error?: string;
}

export default function TarotPage({ seoContent }: { seoContent?: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = authStatus === 'authenticated';
  const gate = useAiGate(isLoggedIn);
  const [step, setStep] = useState<Step>('question');
  const loadingRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const drawnRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<HTMLDivElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'drawing' && drawingRef.current) {
      // 点击抽牌后立刻滚到动画区域居中
      setTimeout(() => {
        drawingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
    // loading 状态不主动滚动，保持用户当前视图位置
    if (step === 'drawn' && drawnRef.current) {
      setTimeout(() => {
        drawnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
    if (step === 'question' && questionRef.current) {
      setTimeout(() => {
        questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [step]);

  const [mode, setMode] = useState<ModeId>('classic');
  const [question, setQuestion] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TarotDrawResult | null>(null);
  const [drawnCards, setDrawnCards] = useState<TarotCard[] | null>(null);

  const [celticModalIdx, setCelticModalIdx] = useState<number | null>(null);

  // 流式输出时随内容增加自动向下滚动
  useEffect(() => {
    if (streaming && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [streaming, result?.reading]);

  const currentSpread = MODE_TO_SPREAD[mode];
  const isDebug = !!process.env.NEXT_PUBLIC_TAROT_DEBUG_TOKEN;

  const handleShare = async () => {
    if (!result) return;

    try {
      const res = await fetch('/api/tarot/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: result.cards,
          question,
          spread: result.spread || currentSpread,
        }),
      });
      const data = await res.json();

      if (navigator.share) {
        await navigator.share({ text: data.shareText });
      } else {
        await navigator.clipboard.writeText(data.shareText);
        alert('分享内容已复制到剪贴板');
      }
    } catch (err) {
      console.error('分享失败:', err);
    }
  };

  const handleModeSelect = (targetMode: ModeId) => {
    if (targetMode === 'celtic' && authStatus === 'loading') {
      return;
    }
    if (!isDebug && targetMode === 'celtic' && !session) {
      window.location.href = '/auth/login?redirect=/tarot';
      return;
    }

    setError('');
    setMode(targetMode);
    setStep('question');
    setResult(null);
    setDrawnCards(null);
    setCelticModalIdx(null);
  };

  const handleDrawCards = async () => {
    setLoading(true);
    setError('');
    setStep('drawing');
    track('tool_submit', { tool: 'tarot', spread: currentSpread });

    try {
      const res = await fetch('/api/tarot/draw-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_TAROT_DEBUG_TOKEN
            ? { 'x-debug-token': process.env.NEXT_PUBLIC_TAROT_DEBUG_TOKEN }
            : {}),
        },
        body: JSON.stringify({
          spread: currentSpread,
          question: question.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        gate.handle(res.status, data.code || data.error);
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为会员专属功能,升级后即可使用。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError('今日免费次数已用完,明日 00:00 自动重置,或升级会员继续使用。');
        } else if (data.error === 'GUEST_LIMIT_REACHED') {
          setError('游客每天可免费占卜 1 次,登录后即可解锁更多次数。');
        } else if (data.error === 'LOGIN_REQUIRED') {
          setError('请先登录后再使用此功能。');
        } else if (data.error === 'RATE_LIMITED' || res.status === 429) {
          setError('操作过于频繁,请稍后再试。');
        } else {
          setError('网络连接不稳定,请稍后重试。');
        }
        setStep('question');
        return;
      }

      setDrawnCards(data.cards);
      setStep('drawn');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setStep('question');
    } finally {
      setLoading(false);
    }
  };

  const handleAIReading = async (cards: TarotCard[], scrollToLoading = false) => {
    setLoading(true);
    setError('');
    setStep('loading');
    track('tool_result_view', { tool: 'tarot', spread: currentSpread });
    if (scrollToLoading) {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }

    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_TAROT_DEBUG_TOKEN
            ? { 'x-debug-token': process.env.NEXT_PUBLIC_TAROT_DEBUG_TOKEN }
            : {}),
        },
        body: JSON.stringify({
          spread: currentSpread,
          question: question.trim(),
          preDrawnCards: cards,
        }),
      });

      if (!res.ok || !res.body) {
        let data: { error?: string; code?: string } = {};
        try {
          data = await res.json();
        } catch {}
        gate.handle(res.status, data.code || data.error);
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为会员专属功能,升级后即可使用。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError('今日免费次数已用完,明日 00:00 自动重置,或升级会员继续使用。');
        } else if (data.error === 'GUEST_LIMIT_REACHED') {
          setError('游客每天可免费占卜 1 次,登录后即可解锁更多次数。');
        } else if (data.error === 'LOGIN_REQUIRED') {
          setError('请先登录后再使用此功能。');
        } else if (data.error === 'RATE_LIMITED' || res.status === 429) {
          setError('操作过于频繁,请稍后再试。');
        } else {
          setError('网络连接不稳定,请稍后重试。');
        }
        setStep('drawn');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaSet = false;
      let acc = '';

      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const linesArr = buffer.split('\n');
        buffer = linesArr.pop() || '';

        for (const ln of linesArr) {
          const t = ln.trim();
          if (!t || !t.startsWith('data:')) continue;
          const d = t.slice(5).trim();
          if (d === '[DONE]') continue;
          try {
            const json = JSON.parse(d);
            if (json.meta && !metaSet) {
              metaSet = true;
              setLoading(false);
              const initial: TarotDrawResult = {
                spread: json.meta.spread,
                cards: cards,
                reading: '',
                caution: json.meta.caution,
                _source: json.meta._source,
                _error: json.meta._error,
              };
              setResult(initial);
              setStep('result');
            } else if (json.content) {
              acc += json.content;
              setResult((prev) => (prev ? { ...prev, reading: acc } : prev));
            }
          } catch {}
        }
      }

      setStreaming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setStep('drawn');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const reset = () => {
    setStep('question');
    setQuestion('');
    setResult(null);
    setDrawnCards(null);
    setError('');
    setCelticModalIdx(null);
  };

  const renderResultCard = (
    card: TarotCard,
    idx: number,
    spread: TarotSpread,
    positions: string[],
  ) => {
    const isCeltic = spread === 'celtic';
    const isFiveCard = spread === 'mirror' || spread === 'relationship';

    const containerWidth = isCeltic ? 80 : isFiveCard ? 110 : 140;

    return (
      <div
        key={`${card.id}-${idx}`}
        className="text-center"
        onClick={() => {
          if (isCeltic) {
            setCelticModalIdx(idx);
          }
        }}
        style={isCeltic ? { cursor: 'pointer' } : undefined}
      >
        <p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">
          {card.position || positions[idx]}
        </p>
        <div className="mx-auto" style={{ width: containerWidth, maxWidth: '100%' }}>
          <div
            className="relative overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6]"
            style={{ aspectRatio: '2 / 3' }}
          >
            <img
              src={card.image_url}
              alt={card.name_zh}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: card.orientation === 'reversed' ? 'rotate(180deg)' : undefined,
              }}
            />
          </div>
        </div>
        <h4 className={`mt-2 font-medium text-[#1C1A16] ${isCeltic ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
          {card.name_zh}
        </h4>
        <span
          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
            card.orientation === 'upright'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {card.orientation === 'upright' ? '正位' : '逆位'}
        </span>
      </div>
    );
  };

  const renderCards = () => {
    if (!result) return null;

    const spread = (result.spread as TarotSpread) || currentSpread;
    const positions = getPositions(spread);

    if (spread === 'celtic') {
      return (
        <>
          {/* 桌面端十字布局 */}
          <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(4, auto)', gap: '12px' }}>
            {result.cards.map((card, idx) => {
              const pos = CELTIC_DESKTOP_LAYOUT[idx];
              return (
                <div
                  key={`celtic-${card.id}-${idx}`}
                  style={{ gridColumn: pos.col, gridRow: pos.row }}
                >
                  {renderResultCard(card, idx, spread, positions)}
                </div>
              );
            })}
          </div>
          {/* 移动端 2 列列表 */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {result.cards.map((card, idx) => renderResultCard(card, idx, spread, positions))}
          </div>
        </>
      );
    }

    if (spread === 'mirror' || spread === 'relationship') {
      return (
        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
          {result.cards.map((card, idx) => (
            <div key={`${spread}-${card.id}-${idx}`} className="md:w-[150px]">
              {renderResultCard(card, idx, spread, positions)}
            </div>
          ))}
        </div>
      );
    }

    // classic & moonlight: grid-cols-3
    return (
      <div className="grid grid-cols-3 justify-items-center gap-2 sm:gap-4">
        {result.cards.map((card, idx) => renderResultCard(card, idx, spread, positions))}
      </div>
    );
  };

  return (
    <div className="relative min-h-dvh bg-[#FAF9F6] text-[#1C1A16]">
      <AiGateModals gate={gate} callbackUrl="/tarot" />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'none\' stroke=\'%231C1A16\' stroke-width=\'1\'/%3E%3Cpath d=\'M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 5\' fill=\'%231C1A16\'/%3E%3Cpath d=\'M50 95 A45 45 0 0 1 50 5 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 95\' fill=\'%23FFFFFF\'/%3E%3Ccircle cx=\'50\' cy=\'27\' r=\'5\' fill=\'%23FFFFFF\' stroke=\'%231C1A16\' stroke-width=\'1\'/%3E%3Ccircle cx=\'50\' cy=\'73\' r=\'5\' fill=\'%231C1A16\'/%3E%3C/svg%3E")',
          backgroundSize: '140px 140px',
          backgroundRepeat: 'repeat',
        }}
      />

      <main className="px-4 pb-20 md:pb-24">
        <section className="mx-auto max-w-page pt-10 sm:pt-16 md:pt-24 pb-8 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(44px,6vw,60px)] leading-tight tracking-[0.08em] text-[#1C1A16]">
            AI 塔罗占卜
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-relaxed tracking-[0.02em] text-[#1C1A16]/55">
            人工智能驱动的专业塔罗牌解读，探索生命的奥秘，寻找内心的答案
          </p>
        </section>

        <section className="mx-auto max-w-page space-y-4 animate-fadeIn">
          {step !== 'loading' && step !== 'drawing' && (
            <div ref={questionRef} className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5 transition-shadow duration-300 hover:shadow-card-hover md:p-8">
              <h2 className="text-lg font-bold text-[#1C1A16] mb-1">提出您的问题</h2>
              <p className="text-sm text-[#1C1A16]/50 mb-4">请输入一个明确的问题，AI 将为您抽取塔罗牌并提供专业解读</p>

              {/* 横向滚动示例问题 */}
              <div className="relative mb-4">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pr-8" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {SAMPLE_PROMPTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setActivePrompt(item);
                        setQuestion(item);
                      }}
                      className="flex-shrink-0 inline-flex items-center min-h-[44px] cursor-pointer rounded-full border border-[#1C1A16]/15 px-3 py-2 text-xs text-[#1C1A16]/65 transition-colors hover:border-[#1C1A16]/40 hover:text-[#1C1A16] whitespace-nowrap"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-1">
                  <span className="text-[#1C1A16]/35 text-xs">›</span>
                </div>
              </div>

              {/* 单行输入框 */}
              <input
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value.slice(0, 200));
                  setActivePrompt(null);
                }}
                placeholder="输入您的问题..."
                maxLength={200}
                className={inputRecipe}
              />

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              {step !== 'drawn' && (
                <button
                  type="button"
                  onClick={handleDrawCards}
                  disabled={loading}
                  className="group relative mt-4 flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-accent text-[15px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-accent-hover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 正在抽牌…</>
                  ) : step === 'result' ? (
                    <><RefreshCw className="h-4 w-4" /> 重新抽牌</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> 抽取塔罗牌</>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 md:p-8">
            <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] text-center mb-4">选择您的塔罗体验</h2>
            <hr className="border-[#E5E0D8] mb-4" />
            <p className="text-center text-base font-semibold text-[#1C1A16]/60 mb-8">不同解读风格</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {MODES.map((item) => {
                const active = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeSelect(item.id)}
                    className={`flex flex-col items-center text-center rounded-2xl border-2 p-4 py-6 transition-all duration-200 ${
                      active
                        ? 'border-brand-accent bg-brand-accent-tint shadow-sm'
                        : 'border-[#E5E0D8] bg-white hover:border-[#1C1A16]/40 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 flex-shrink-0 border-2 transition-all duration-200 ${active ? 'bg-brand-accent border-brand-accent text-white' : 'bg-transparent border-[#1C1A16]/25 text-[#1C1A16]'}`}>
                      {item.icon}
                    </div>
                    <p className={`text-base font-semibold mb-2 ${active ? 'text-[#1C1A16]' : 'text-[#1C1A16]'}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-[#6B7280] leading-relaxed flex-1">{item.desc}</p>
                    <p className={`text-xs mt-3 font-medium ${active ? 'text-brand-accent' : 'text-[#9CA3AF]'}`}>
                      {active ? '✓ 当前风格' : '选择此风格 →'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {step === 'loading' && (
            <div className="space-y-4">
              {drawnCards && drawnCards.length === (currentSpread === 'celtic' ? 10 : currentSpread === 'mirror' || currentSpread === 'relationship' ? 5 : currentSpread === 'moonlight' ? 3 : 3) && (
                <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5 md:p-6">
                  <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] text-center mb-5">✨ 您抽到了这些牌</h3>
                  <div>
                    {(() => {
                      const spread = (currentSpread as TarotSpread);
                      const positions = getPositions(spread);
                      if (spread === 'celtic') {
                        return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{drawnCards.map((card, idx) => <div key={idx} className="text-center"><p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">{card.position || positions[idx]}</p><div className="mx-auto" style={{width:80,maxWidth:'100%'}}><div className="relative overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6]" style={{aspectRatio:'2/3'}}><img src={card.image_url} alt={card.name_zh} style={{width:'100%',height:'100%',objectFit:'cover',transform:card.orientation==='reversed'?'rotate(180deg)':undefined}} /></div></div><h4 className="mt-2 text-[10px] sm:text-xs font-medium text-[#1C1A16]">{card.name_zh}</h4><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${card.orientation==='upright'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{card.orientation==='upright'?'正位':'逆位'}</span></div>)}</div>;
                      }
                      if (spread === 'mirror' || spread === 'relationship') {
                        return <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">{drawnCards.map((card, idx) => <div key={idx} className="md:w-[150px] text-center"><p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">{card.position || positions[idx]}</p><div className="mx-auto" style={{width:110,maxWidth:'100%'}}><div className="relative overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6]" style={{aspectRatio:'2/3'}}><img src={card.image_url} alt={card.name_zh} style={{width:'100%',height:'100%',objectFit:'cover',transform:card.orientation==='reversed'?'rotate(180deg)':undefined}} /></div></div><h4 className="mt-2 text-xs font-medium text-[#1C1A16]">{card.name_zh}</h4><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${card.orientation==='upright'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{card.orientation==='upright'?'正位':'逆位'}</span></div>)}</div>;
                      }
                      return <div className="grid grid-cols-3 justify-items-center gap-2 sm:gap-4">{drawnCards.map((card, idx) => <div key={idx} className="text-center"><p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">{card.position || positions[idx]}</p><div className="mx-auto" style={{width:140,maxWidth:'100%'}}><div className="relative overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6]" style={{aspectRatio:'2/3'}}><img src={card.image_url} alt={card.name_zh} style={{width:'100%',height:'100%',objectFit:'cover',transform:card.orientation==='reversed'?'rotate(180deg)':undefined}} /></div></div><h4 className="mt-2 text-xs sm:text-sm font-medium text-[#1C1A16]">{card.name_zh}</h4><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${card.orientation==='upright'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{card.orientation==='upright'?'正位':'逆位'}</span></div>)}</div>;
                    })()}
                  </div>
                </div>
              )}
              <div ref={loadingRef} className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 text-center min-h-[400px] flex flex-col items-center justify-center">
                <div className="flex justify-center">
                  <OracleLoading />
                </div>
              </div>
            </div>
          )}

          {step === 'drawing' && (
            <div ref={drawingRef} className="rounded-2xl border border-[#1C1A16]/10 bg-white p-10 md:p-16 text-center flex flex-col items-center justify-center min-h-[280px]">
              <div className="flex justify-center">
                <OracleLoading />
              </div>
            </div>
          )}

          {step === 'drawn' && drawnCards && (
            <div ref={drawnRef} className="space-y-4">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16] text-center">✨ 您抽到了这些牌</h3>
                <div className="mt-6">
                  {(() => {
                    const spread = currentSpread;
                    const positions = getPositions(spread);
                    const containerWidth = spread === 'celtic' ? 80 : spread === 'mirror' || spread === 'relationship' ? 110 : 140;

                    const renderCard = (card: TarotCard, idx: number) => (
                      <div key={`drawn-${card.id}-${idx}`} className="text-center">
                        <p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">
                          {card.position || positions[idx]}
                        </p>
                        <div className="mx-auto" style={{ width: containerWidth, maxWidth: '100%' }}>
                          <div
                            className="relative overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6]"
                            style={{ aspectRatio: '2 / 3' }}
                          >
                            <img
                              src={card.image_url}
                              alt={card.name_zh}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: card.orientation === 'reversed' ? 'rotate(180deg)' : undefined,
                              }}
                            />
                          </div>
                        </div>
                        <h4 className={`mt-2 font-medium text-[#1C1A16] ${spread === 'celtic' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
                          {card.name_zh}
                        </h4>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                            card.orientation === 'upright'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {card.orientation === 'upright' ? '正位' : '逆位'}
                        </span>
                      </div>
                    );

                    if (spread === 'celtic') {
                      return (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                          {drawnCards.map((card, idx) => renderCard(card, idx))}
                        </div>
                      );
                    }

                    if (spread === 'mirror' || spread === 'relationship') {
                      return (
                        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
                          {drawnCards.map((card, idx) => (
                            <div key={`${spread}-drawn-${card.id}-${idx}`} className="md:w-[150px]">
                              {renderCard(card, idx)}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-3 justify-items-center gap-2 sm:gap-4">
                        {drawnCards.map((card, idx) => renderCard(card, idx))}
                      </div>
                    );
                  })()}
                </div>
                {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
              </div>
              <div className="text-center py-2">
                <button
                  type="button"
                  onClick={() => handleAIReading(drawnCards)}
                  disabled={loading}
                  className="inline-flex items-center gap-3 h-[52px] px-8 rounded-full bg-brand-accent text-base font-medium text-white transition-all hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-lg">✦</span>
                  <span>AI 解读牌义</span>
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4" aria-live="polite">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5 md:p-6">
                <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] text-center mb-5">✨ 您抽到了这些牌</h3>
                <div>
                  {renderCards()}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 md:p-8">
                <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] mb-4">✨ AI 解读</h3>
                <div className="text-[#3D3A35] text-[15px] leading-[1.9]">
                  {streaming ? (
                    <>
                      <p className="whitespace-pre-wrap">
                        {result.reading}
                        <span className="inline-block w-0.5 h-4 bg-[#1C1A16] ml-0.5 animate-pulse" />
                      </p>
                      <div ref={streamEndRef} />
                    </>
                  ) : (
                    <div className="space-y-5">
                      {result.reading
                        .split(/\n{1,}/)
                        .map(p => p.trim())
                        .filter(p => p.length > 0)
                        .map((para, i) => (
                          <p key={i} className="indent-[2em]">{para}</p>
                        ))}
                    </div>
                  )}
                </div>
                {!streaming && result._source === 'fallback' && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">
                      ⚠️ {result.caution || 'AI 解读失败，以下为基础牌义参考，请稍后重试。'}
                    </p>
                  </div>
                )}
                {!streaming && result._source !== 'fallback' && result.caution && (
                  <p className="mt-6 text-xs text-[#9CA3AF] border-t border-[#E5E0D8] pt-4">
                    ⚠️ {result.caution}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm text-[#6B7280] transition-all hover:border-[#1C1A16]/40 hover:text-[#1C1A16]"
                >
                  <Share2 size={14} />分享
                </button>
                {drawnCards && (
                  <button
                    type="button"
                    onClick={() => handleAIReading(drawnCards, true)}
                    disabled={loading || streaming}
                    className="rounded-xl border border-[#1C1A16]/30 px-4 py-2 text-sm text-[#1C1A16] transition-all hover:bg-[#1C1A16] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✨ 重新解读
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm text-[#6B7280] transition-all hover:border-[#1C1A16]/40 hover:text-[#1C1A16]"
                >
                  再来一次
                </button>
              </div>
            </div>
          )}
        </section>

        {seoContent}
      </main>


      {/* 凯尔特十字牌面详情 Modal */}
      {celticModalIdx !== null && result && result.cards[celticModalIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCelticModalIdx(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCelticModalIdx(null)}
              className="absolute top-4 right-4 rounded-full p-1 text-[#1C1A16]/60 transition-colors hover:bg-gray-100 hover:text-[#1C1A16]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-[#1C1A16]/12">
                <Image
                  src={result.cards[celticModalIdx].image_url}
                  alt={result.cards[celticModalIdx].name_zh}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs tracking-[0.16em] text-[#1C1A16]/55">
                  {result.cards[celticModalIdx].position || CELTIC_POSITIONS[celticModalIdx]}
                </p>
                <h3 className="font-display text-lg text-[#1C1A16]">
                  {result.cards[celticModalIdx].name_zh}
                </h3>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                    result.cards[celticModalIdx].orientation === 'upright'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {result.cards[celticModalIdx].orientation === 'upright' ? '正位' : '逆位'}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1C1A16]">传统含义</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1C1A16]/80">
                  {result.cards[celticModalIdx].orientation === 'upright'
                    ? result.cards[celticModalIdx].upright
                    : result.cards[celticModalIdx].reversed}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1C1A16]">位置解读</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1C1A16]/80">
                  {result.cards[celticModalIdx].meaning}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1C1A16]">关键词</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.cards[celticModalIdx].keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-[#FAF9F6] px-2 py-0.5 text-xs text-[#1C1A16]/70"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

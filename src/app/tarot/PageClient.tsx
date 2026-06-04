'use client';

import dynamic from 'next/dynamic';
import { Footer } from '@/components/layout/Footer';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { OracleLoading } from '@/components/ui/OracleLoading';
import { ChevronDown, ChevronUp, Share2, X } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

const CardDrawAnimation = dynamic(() => import('@/components/tarot/CardDrawAnimation').then(m => m.CardDrawAnimation), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  ),
});

const SAMPLE_PROMPTS = [
  '我的感情走向如何？',
  '这份工作值得去吗？',
  '他/她是怎么想的？',
  '我该如何做这个决定？',
];

type TarotSpread = 'three' | 'celtic' | 'moonlight' | 'mirror';

const THREE_POSITIONS = ['过去', '现在', '未来'];

const CELTIC_POSITIONS = [
  '①现状',
  '②挑战',
  '③意识',
  '④根源',
  '⑤希望/恐惧',
  '⑥近期发展',
  '⑦可能结果',
  '⑧外部环境',
  '⑨心态信念',
  '⑩最终结局',
];

const MOONLIGHT_POSITIONS = ['身心灵', '潜意识', '指引'];

const MIRROR_POSITIONS = ['现状', '阻碍', '建议', '风险', 'Outcome'];

const CELTIC_DESKTOP_LAYOUT: { col: number; row: number }[] = [
  { col: 1, row: 4 }, // ①现状
  { col: 2, row: 2 }, // ②挑战
  { col: 2, row: 4 }, // ③意识
  { col: 3, row: 4 }, // ④根源
  { col: 2, row: 3 }, // ⑤希望/恐惧
  { col: 2, row: 1 }, // ⑥近期发展
  { col: 5, row: 4 }, // ⑦可能结果
  { col: 3, row: 2 }, // ⑧外部环境 → 修正为 col3,row4 → 按需求 col3,row4 已被④占用
  { col: 4, row: 2 }, // ⑨心态信念
  { col: 1, row: 2 }, // ⑩最终结局
];

const MODES = [
  { id: 'classic' as const, icon: '⚫', name: '经典', desc: '3张牌·过去/现在/未来，新手首选', tooltip: '3张牌过去/现在/未来，新手首选' },
  { id: 'celtic' as const, icon: '✝︎', name: '凯尔特十字', desc: '10张牌·全面深度分析，会员专属', tooltip: '10张牌深度解读，全面分析人生各维度' },
  { id: 'moonlight' as const, icon: '🌙', name: '月光', desc: '3张牌·柔和内省，适合情感探索', tooltip: '温柔内省风格，适合情感/睡前探索' },
  { id: 'mirror' as const, icon: '✧', name: '镜像', desc: '5张牌·多角度透视，复杂决策专用', tooltip: '5张多角度深度分析，复杂决策专用' },
];

const FAQ_ITEMS = [
  {
    q: 'AI 塔罗占卜和小程序抽牌有什么区别？',
    a: '我们的系统结合了传统塔罗牌意数据库与大语言模型，不是随机抽取固定文案，而是根据你的问题和抽到的牌实时生成个性化解读。每次解读都是独一无二的。',
  },
  {
    q: '如果抽到"不好"的牌怎么办？',
    a: '塔罗牌没有绝对的好坏。所谓"负面"牌往往是在提醒你注意某些方面，是一种保护和指引。我们的 AI 会以建设性的方式帮你理解牌面的参考价值。',
  },
  {
    q: 'AI 塔罗占卜适合频繁使用吗？',
    a: '建议对同一个问题不要频繁重复占卜。塔罗更适合作为定期自我反思的工具（如每周一次），而非反复确认同一件事。频繁占卜容易导致依赖和焦虑。',
  },
] as const;

const SPREAD_TO_MODE: Record<TarotSpread, string> = {
  three: '经典三张牌',
  celtic: '凯尔特十字',
  moonlight: '月光三张牌',
  mirror: '镜像五张牌',
};

type ModeId = (typeof MODES)[number]['id'];
type Step = 'question' | 'loading' | 'result';

const MODE_TO_SPREAD: Record<ModeId, TarotSpread> = {
  classic: 'three',
  celtic: 'celtic',
  moonlight: 'moonlight',
  mirror: 'mirror',
};

function getPositions(spread: TarotSpread): string[] {
  switch (spread) {
    case 'celtic':
      return CELTIC_POSITIONS;
    case 'moonlight':
      return MOONLIGHT_POSITIONS;
    case 'mirror':
      return MIRROR_POSITIONS;
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
  overallNarrative: string;
  detailedReading: string;
  advice: string;
  caution: string;
}

export default function TarotPage() {
  const { data: session, status: authStatus } = useSession();
  const [step, setStep] = useState<Step>('question');
  const [mode, setMode] = useState<ModeId>('classic');
  const [question, setQuestion] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TarotDrawResult | null>(null);
  const [detailedExpanded, setDetailedExpanded] = useState(true);
  const [flippedCards, setFlippedCards] = useState<boolean[]>([]);
  const [showReading, setShowReading] = useState(false);
  const [useLegacyDrawAnimation] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [celticModalIdx, setCelticModalIdx] = useState<number | null>(null);
  const flipTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearFlipTimers = () => {
    flipTimersRef.current.forEach((timer) => clearTimeout(timer));
    flipTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearFlipTimers();
    };
  }, []);

  const currentSpread = MODE_TO_SPREAD[mode];

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
    if (targetMode === 'celtic' && !session) {
      window.location.href = '/auth/login?redirect=/tarot';
      return;
    }

    setError('');
    setMode(targetMode);
    setStep('question');
    setQuestion('');
    setResult(null);
    setDetailedExpanded(false);
    setFlippedCards([]);
    setShowReading(false);
    setCelticModalIdx(null);
    clearFlipTimers();
  };

  const startFlipSequence = (cardCount: number) => {
    clearFlipTimers();
    setShowReading(false);
    setFlippedCards(Array(cardCount).fill(false));

    const startTimer = setTimeout(() => {
      for (let i = 0; i < cardCount; i += 1) {
        const timer = setTimeout(() => {
          setFlippedCards((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 300);
        flipTimersRef.current.push(timer);
      }
    }, 1500);

    const doneTimer = setTimeout(() => {
      setShowReading(true);
    }, 1500 + (cardCount - 1) * 300 + 650);

    flipTimersRef.current.push(startTimer, doneTimer);
  };

  const handleDraw = async () => {
    setLoading(true);
    setError('');
    setStep('loading');

    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spread: currentSpread,
          question: question.trim(),
        }),
      });

      if (!res.ok || !res.body) {
        let data: { error?: string } = {};
        try {
          data = await res.json();
        } catch {}
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为会员专属功能，升级后即可使用。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError('今日免费次数已用完，明日 00:00 自动重置，或升级会员继续使用。');
        } else {
          setError('网络连接不稳定，请稍后重试。');
        }
        setStep('question');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaSet = false;
      let acc = '';
      let cardCount = 0;

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
                cards: json.meta.cards,
                overallNarrative: '',
                detailedReading: json.meta.detailedReading,
                advice: json.meta.advice,
                caution: json.meta.caution,
              };
              cardCount = json.meta.cards.length;
              setResult(initial);
              setDetailedExpanded(false);
              setStep('result');
              startFlipSequence(cardCount);
            } else if (json.content) {
              acc += json.content;
              setResult((prev) => (prev ? { ...prev, overallNarrative: acc } : prev));
            }
          } catch {}
        }
      }

      setStreaming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setStep('question');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const reset = () => {
    clearFlipTimers();
    setStep('question');
    setQuestion('');
    setResult(null);
    setError('');
    setDetailedExpanded(false);
    setFlippedCards([]);
    setShowReading(false);
    setCelticModalIdx(null);
  };

  const isFlipping = step === 'result' && !showReading;

  const renderResultCard = (
    card: TarotCard,
    idx: number,
    spread: TarotSpread,
    positions: string[],
  ) => {
    const isFlipped = Boolean(flippedCards[idx]);
    const isCeltic = spread === 'celtic';
    const isMirror = spread === 'mirror';

    const containerWidth = isCeltic ? 80 : isMirror ? 110 : 140;

    return (
      <div
        key={`${card.id}-${idx}`}
        className="text-center"
        onClick={() => {
          if (isCeltic && isFlipped) {
            setCelticModalIdx(idx);
          }
        }}
        style={isCeltic && isFlipped ? { cursor: 'pointer' } : undefined}
      >
        <p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">
          {card.position || positions[idx]}
        </p>
        <div className="card-container mx-auto" style={{ width: containerWidth, maxWidth: '100%' }}>
          <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
            <div
              className="card-front border border-[#1C1A16]/15"
              style={{ background: 'linear-gradient(145deg, #f7f2e7 0%, #e8dcc2 52%, #d9c5a3 100%)' }}
            >
              <div className="flex h-full w-full items-center justify-center">
                <div className="rounded-full border border-[#1C1A16]/20 px-2 py-0.5 text-[10px] tracking-[0.2em] text-[#1C1A16]/70 sm:px-3 sm:py-1 sm:text-sm">
                  TAROT
                </div>
              </div>
            </div>
            <div className="card-back border border-[#1C1A16]/12 bg-[#FAF9F6]">
              <img
                src={card.image_url}
                alt={card.name_zh}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
        <h4 className={`mt-2 font-medium text-[#1C1A16] ${isCeltic ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>
          {card.name_zh}
        </h4>
        {isFlipped ? (
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
              card.orientation === 'upright'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {card.orientation === 'upright' ? '正位' : '逆位'}
          </span>
        ) : (
          <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
            待揭示
          </span>
        )}
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

    if (spread === 'mirror') {
      return (
        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
          {result.cards.map((card, idx) => (
            <div key={`mirror-${card.id}-${idx}`} className="md:w-[150px]">
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

  const spreadTitle = result
    ? SPREAD_TO_MODE[(result.spread as TarotSpread) || currentSpread] || '经典三张牌'
    : '经典三张牌';

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
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
        <section className="mx-auto max-w-5xl pt-24 pb-10 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(44px,6vw,60px)] leading-tight tracking-[0.08em] text-[#1C1A16]">
            AI 塔罗占卜
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-relaxed tracking-[0.02em] text-[#1C1A16]/55">
            人工智能驱动的塔罗牌解读系统，更准确、更有深度的占卜体验。
          </p>
        </section>

        <section className="mx-auto max-w-5xl space-y-4 animate-fadeIn">
          {step !== 'loading' && step !== 'result' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              <label className="mb-2 block text-sm text-[#1C1A16]/75">你的问题</label>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value.slice(0, 200));
                    setActivePrompt(null);
                  }}
                  placeholder="请输入一个你想通过塔罗牌探索的问题或主题..."
                  maxLength={200}
                  className="min-h-[100px] max-h-[200px] w-full resize-y rounded-xl border border-gray-300 p-4 pb-7 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/35 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
                />
                <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#1C1A16]/45">
                  {question.length}/200
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((item) => {
                  const isActive = activePrompt === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setActivePrompt(item);
                        setQuestion(item);
                      }}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${
                        isActive
                          ? 'bg-[#1C1A16] text-white border border-[#1C1A16]'
                          : 'bg-gray-50 text-[#1C1A16]/70 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleDraw}
                disabled={loading}
                className="mt-5 h-[44px] w-full rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                🃏 开始解读
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 md:p-6">
            <h2 className="font-display text-lg tracking-[0.08em] text-[#1C1A16]">模式选择</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {MODES.map((item) => {
                const active = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeSelect(item.id)}
                    className={`group/tip rounded-xl border p-3 text-left transition-all duration-300 ${
                      active
                        ? 'border-[#1C1A16]/20 bg-[#FAF9F6] shadow-card-hover'
                        : 'border-[#1C1A16]/10 bg-white hover:border-[#1C1A16]/20 hover:shadow-card-hover'
                    }`}
                  >
                    <p className="relative flex items-center text-sm font-semibold text-[#1C1A16]">
                      <span className="mr-1">{item.icon}</span>
                      {item.name}
                      <span className="relative ml-1 inline-block cursor-help text-[12px] text-[#1C1A16]/40">
                        ⓘ
                        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1C1A16] px-3 py-2 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/tip:opacity-100 group-active/tip:opacity-100">
                          {item.tooltip}
                        </span>
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#1C1A16]/60">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {step === 'loading' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 text-center transition-shadow duration-300 hover:shadow-card-hover md:p-10">
              {useLegacyDrawAnimation ? (
                <CardDrawAnimation cardCount={3} onComplete={() => undefined} />
              ) : (
                <div className="flex justify-center">
                  <OracleLoading />
                </div>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4" aria-live="polite">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">{spreadTitle}</h3>
                <div className="mt-4">
                  {renderCards()}
                </div>
                {isFlipping && <p className="mt-4 text-center text-sm text-[#1C1A16]/60">牌面正在揭示中...</p>}
              </div>

              {showReading && (
                <>
                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                    <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">牌面含义</h3>
                    <div className="mt-3 space-y-3">
                      {result.cards.map((card, index) => (
                        <div key={`meaning-${card.id}-${index}`} className="rounded-xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1C1A16]">{card.name_zh}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] ${
                                card.orientation === 'upright'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {card.orientation === 'upright' ? '正位' : '逆位'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/80">
                            传统含义：{card.orientation === 'upright' ? card.upright : card.reversed}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[#1C1A16]/80">现代解读：{card.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                    <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">综合解读</h3>
                    <p className="mt-1 text-xs text-[#1C1A16]/45">AI 牌意解读 · 仅供参考</p>
                    {streaming && !result.overallNarrative ? (
                      <div className="mt-3">
                        <OracleLoading />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/80">
                        {result.overallNarrative}
                        {streaming && result.overallNarrative && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                        )}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                    <button
                      type="button"
                      onClick={() => setDetailedExpanded((prev) => !prev)}
                      className="text-sm font-medium text-[#1C1A16]"
                    >
                      {detailedExpanded ? '▼ 收起详细解读' : '▶ 展开详细解读'}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        detailedExpanded ? 'mt-3 max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-sm leading-relaxed text-[#1C1A16]/80">{result.detailedReading}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                    <h3 className="font-display text-xl tracking-[0.06em] text-[#1C1A16]">💡 塔罗的建议</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/80">{result.advice}</p>
                    <p className="mt-3 rounded bg-amber-50 px-2 py-1 text-sm text-amber-700">⚠ {result.caution}</p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:justify-center">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center rounded-xl border border-[#1C1A16]/15 bg-transparent px-[32px] py-[12px] text-sm text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  分享结果
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-[#1C1A16]/15 bg-transparent px-[32px] py-[12px] text-sm text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  再来一次
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mx-auto mt-10 max-w-5xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">AI 塔罗占卜应用场景</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: '💕', title: '爱情关系探索', desc: '探索感情走向、了解伴侣想法、处理情感困惑' },
              { icon: '💼', title: '事业发展与决策', desc: '职业选择、项目前景、职场人际关系判断' },
              { icon: '🔀', title: '重要抉择参考', desc: '面临人生十字路口时获取额外视角' },
              { icon: '🌟', title: '日常灵感指引', desc: '每日一牌、寻找生活灵感、自我对话与觉察' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-[#1C1A16]/8 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF9F6] text-base">{item.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1A16]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#1C1A16]/68">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-5xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">常见问题</h2>
          <div className="mt-4 space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const expanded = expandedFaq === index;
              return (
                <div key={item.q} className="rounded-xl border border-[#1C1A16]/10 bg-white p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setExpandedFaq((prev) => (prev === index ? null : index))}
                  >
                    <span className="text-sm font-semibold text-[#1C1A16]">{item.q}</span>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#1C1A16]/70" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#1C1A16]/70" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expanded ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-[#1C1A16]/72">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <AiDisclaimer />
          <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-white p-3 text-center text-xs text-[#1C1A16]/45">
            ⚠️ 免责声明：本站塔罗占卜内容仅供娱乐与自我探索参考，不构成医疗、法律或投资建议。请结合现实信息理性判断。
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-5xl animate-fadeIn rounded-2xl bg-gradient-to-b from-[#FAF9F6] to-white p-8 text-center md:p-12">
          <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">体验 AI 塔罗占卜的智慧</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#1C1A16]/60">
            赛博命理师的 AI 塔罗系统融合了传统塔罗智慧与现代 AI 技术，为你提供更准确、更有深度的解读。无论你是塔罗新手还是资深爱好者，都能从中获得启发。
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="rounded-xl bg-[#1C1A16] px-8 py-3 text-sm font-medium text-white transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              开始我的塔罗解读 →
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/bazi';
              }}
              className="rounded-xl border border-[#1C1A16]/15 bg-transparent px-8 py-3 text-sm font-medium text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              试试八字分析 →
            </button>
          </div>
        </section>
      </main>

      <Footer />

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

      <style jsx>{`
        .card-container {
          perspective: 1000px;
        }

        .card-inner {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .card-inner.flipped {
          transform: rotateY(180deg);
        }

        .card-front,
        .card-back {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 0.85rem;
          overflow: hidden;
        }

        .card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

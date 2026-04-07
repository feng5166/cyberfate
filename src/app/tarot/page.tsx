'use client';

import { Footer } from '@/components/layout/Footer';
import { CardDrawAnimation } from '@/components/tarot/CardDrawAnimation';
import { Share2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

const SAMPLE_PROMPTS = [
  '我的感情走向如何？',
  '这份工作值得去吗？',
  '他/她是怎么想的？',
  '我该如何做这个决定？',
];

const THREE_POSITIONS = ['过去', '现在', '未来'];

const MODES = [
  { id: 'classic', name: '经典模式', desc: '3 张牌：过去 / 现在 / 未来', comingSoon: false },
  { id: 'celtic', name: '凯尔特十字', desc: 'VIP 深度牌阵', comingSoon: true },
  { id: 'moonlight', name: '月光模式', desc: '即将上线', comingSoon: true },
  { id: 'mirror', name: '镜像模式', desc: '即将上线', comingSoon: true },
] as const;

type ModeId = (typeof MODES)[number]['id'];
type Step = 'question' | 'loading' | 'result';

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
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>('question');
  const [mode, setMode] = useState<ModeId>('classic');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TarotDrawResult | null>(null);
  const [detailedExpanded, setDetailedExpanded] = useState(false);
  const [flippedCards, setFlippedCards] = useState<boolean[]>([]);
  const [showReading, setShowReading] = useState(false);
  const [useLegacyDrawAnimation] = useState(false);
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

  const handleShare = async () => {
    if (!result) return;

    try {
      const res = await fetch('/api/tarot/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: result.cards,
          question,
          spread: 'three',
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
    if (targetMode === 'celtic' && !session) {
      window.location.href = '/auth/login?redirect=/tarot';
      return;
    }

    if (targetMode !== 'classic') {
      setError('该模式即将上线，当前仅支持经典模式。');
      return;
    }

    setError('');
    setMode('classic');
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
    if (mode !== 'classic') {
      setError('当前仅支持经典模式。');
      return;
    }

    setLoading(true);
    setError('');
    setStep('loading');

    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spread: 'three',
          question: question.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为 VIP 专属功能。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError(data.message || '今日次数已用完，请明日再试。');
        } else {
          setError(data.error || '请求失败，请稍后重试。');
        }
        setStep('question');
        return;
      }

      const data = (await res.json()) as TarotDrawResult;
      setResult(data);
      setDetailedExpanded(false);
      setStep('result');
      startFlipSequence(data.cards.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setStep('question');
    } finally {
      setLoading(false);
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
  };

  const isFlipping = step === 'result' && !showReading;

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
          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 md:p-6">
            <h2 className="font-display text-lg tracking-[0.08em] text-[#1C1A16]">模式选择</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {MODES.map((item) => {
                const active = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeSelect(item.id)}
                    className={`rounded-xl border p-3 text-left transition-all duration-300 ${
                      active
                        ? 'border-[#1C1A16]/20 bg-[#FAF9F6] shadow-card-hover'
                        : 'border-[#1C1A16]/10 bg-white hover:border-[#1C1A16]/20 hover:shadow-card-hover'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#1C1A16]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#1C1A16]/60">{item.desc}</p>
                    {item.comingSoon && (
                      <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        即将上线
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {step === 'question' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              <label className="mb-2 block text-sm text-[#1C1A16]/75">你的问题</label>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                  placeholder="请输入一个你想通过塔罗牌探索的问题或主题..."
                  maxLength={200}
                  className="min-h-[100px] max-h-[200px] w-full resize-y rounded-xl border border-gray-300 p-4 pb-7 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/35 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
                />
                <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#1C1A16]/45">
                  {question.length}/200
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="cursor-pointer rounded-full bg-gray-50 px-3 py-1 text-xs text-[#1C1A16]/70 transition-colors hover:bg-gray-100"
                  >
                    {item}
                  </button>
                ))}
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

          {step === 'loading' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-8 text-center transition-shadow duration-300 hover:shadow-card-hover md:p-10">
              {useLegacyDrawAnimation ? (
                <CardDrawAnimation cardCount={3} onComplete={() => undefined} />
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF9F6]">
                    <Sparkles className="h-7 w-7 animate-spin text-[#1C1A16]" />
                  </div>
                  <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">正在抽牌并解析...</h3>
                  <p className="mt-3 text-sm text-[#1C1A16]/55">AI 正在生成牌阵结果，请稍候。</p>
                  <div className="mt-5 flex justify-center gap-1">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">经典三张牌</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                  {result.cards.map((card, idx) => {
                    const isFlipped = Boolean(flippedCards[idx]);
                    return (
                      <div key={`${card.id}-${idx}`} className="text-center">
                        <p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">
                          {card.position || THREE_POSITIONS[idx]}
                        </p>
                        <div className="card-container mx-auto w-full max-w-[150px]">
                          <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
                            <div
                              className="card-front border border-[#1C1A16]/15"
                              style={{ background: 'linear-gradient(145deg, #f7f2e7 0%, #e8dcc2 52%, #d9c5a3 100%)' }}
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <div className="rounded-full border border-[#1C1A16]/20 px-3 py-1 text-sm tracking-[0.2em] text-[#1C1A16]/70">
                                  TAROT
                                </div>
                              </div>
                            </div>
                            <div className="card-back border border-[#1C1A16]/12 bg-[#FAF9F6]">
                              <Image
                                src={card.image_url}
                                alt={card.name_zh}
                                fill
                                sizes="(max-width: 640px) 33vw, 160px"
                                className="object-cover"
                              />
                            </div>
                          </div>
                        </div>
                        <h4 className="mt-2 text-xs font-medium text-[#1C1A16] sm:text-sm">{card.name_zh}</h4>
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
                  })}
                </div>
                {isFlipping && <p className="mt-4 text-center text-sm text-[#1C1A16]/60">牌面正在揭示中...</p>}
              </div>

              {showReading && (
                <>
                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
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

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                    <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">综合解读</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/80">{result.overallNarrative}</p>
                  </div>

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
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

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
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
      </main>

      <Footer />

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

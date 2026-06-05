'use client';

import dynamic from 'next/dynamic';
import { Footer } from '@/components/layout/Footer';
import { OracleLoading } from '@/components/ui/OracleLoading';
import { Share2, X } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const CardDrawAnimation = dynamic(() => import('@/components/tarot/CardDrawAnimation').then(m => m.CardDrawAnimation), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  ),
});

const SAMPLE_PROMPTS = [
  '我的感情走向如何?',
  '这份工作值得去吗?',
  '他/她是怎么想的?',
  '我该如何做这个决定?',
];

type TarotSpread = 'three' | 'celtic' | 'moonlight' | 'mirror';

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
];

const SPREAD_TO_MODE: Record<TarotSpread, string> = {
  three: '经典三张牌',
  celtic: '凯尔特十字',
  moonlight: '月光三张牌',
  mirror: '镜像五张牌',
};

type ModeId = (typeof MODES)[number]['id'];
type Step = 'question' | 'drawing' | 'drawn' | 'loading' | 'result';

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
  reading: string;
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
  const [drawnCards, setDrawnCards] = useState<TarotCard[] | null>(null);
  const [useLegacyDrawAnimation] = useState(false);

  const [celticModalIdx, setCelticModalIdx] = useState<number | null>(null);

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
    setDrawnCards(null);
    setCelticModalIdx(null);
  };

  const handleDrawCards = async () => {
    setLoading(true);
    setError('');
    setStep('drawing');

    try {
      const res = await fetch('/api/tarot/draw-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spread: currentSpread,
          question: question.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为会员专属功能,升级后即可使用。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError('今日免费次数已用完,明日 00:00 自动重置,或升级会员继续使用。');
        } else if (data.error === 'LOGIN_REQUIRED') {
          setError('请先登录后再使用此功能。');
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

  const handleAIReading = async (cards: TarotCard[]) => {
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
          preDrawnCards: cards,
        }),
      });

      if (!res.ok || !res.body) {
        let data: { error?: string } = {};
        try {
          data = await res.json();
        } catch {}
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为会员专属功能,升级后即可使用。');
        } else if (data.error === 'QUOTA_EXCEEDED') {
          setError('今日免费次数已用完,明日 00:00 自动重置,或升级会员继续使用。');
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
    const isMirror = spread === 'mirror';

    const containerWidth = isCeltic ? 80 : isMirror ? 110 : 140;

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
            人工智能驱动的专业塔罗牌解读，探索生命的奥秘，寻找内心的答案
          </p>
        </section>

        <section className="mx-auto max-w-5xl space-y-4 animate-fadeIn">
          {step !== 'loading' && step !== 'drawing' && (
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

              {step !== 'drawn' && (
                <button
                  type="button"
                  onClick={handleDrawCards}
                  disabled={loading}
                  className="mt-5 h-[44px] w-full rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === 'result' ? '🔄 重新抽牌' : '🎴 抽取塔罗牌'}
                </button>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 md:p-8">
            <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] text-center mb-4">选择您的塔罗体验</h2>
            <hr className="border-[#E5E0D8] mb-4" />
            <p className="text-center text-base font-semibold text-[#1C1A16]/60 mb-8">不同解读风格</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {MODES.map((item) => {
                const active = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeSelect(item.id)}
                    className={`flex flex-col items-center text-center rounded-2xl border-2 p-5 py-8 transition-all duration-200 ${
                      active
                        ? 'border-[#1C1A16] bg-gray-100 shadow-sm'
                        : 'border-[#E5E0D8] bg-white hover:border-[#1C1A16]/40 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 flex-shrink-0 border-2 transition-all duration-200 ${active ? 'bg-[#1C1A16] border-[#1C1A16] text-white' : 'bg-transparent border-[#1C1A16]/25 text-[#1C1A16]'}`}>
                      {item.icon}
                    </div>
                    <p className={`text-base font-semibold mb-2 ${active ? 'text-[#1C1A16]' : 'text-[#1C1A16]'}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-[#6B7280] leading-relaxed flex-1">{item.desc}</p>
                    <p className={`text-xs mt-3 font-medium ${active ? 'text-[#1C1A16]' : 'text-[#9CA3AF]'}`}>
                      {active ? '✓ 当前风格' : '选择此风格 →'}
                    </p>
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

          {step === 'drawing' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 text-center transition-shadow duration-300 hover:shadow-card-hover md:p-10">
              <div className="flex justify-center">
                <OracleLoading />
              </div>
              <p className="mt-4 text-sm text-[#1C1A16]/60">正在抽取塔罗牌...</p>
            </div>
          )}

          {step === 'drawn' && drawnCards && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-3 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
                <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16] text-center">✨ 您抽到了这些牌</h3>
                <div className="mt-6">
                  {(() => {
                    const spread = currentSpread;
                    const positions = getPositions(spread);
                    const containerWidth = spread === 'celtic' ? 80 : spread === 'mirror' ? 110 : 140;

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

                    if (spread === 'mirror') {
                      return (
                        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
                          {drawnCards.map((card, idx) => (
                            <div key={`mirror-drawn-${card.id}-${idx}`} className="md:w-[150px]">
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
                <button
                  type="button"
                  onClick={() => handleAIReading(drawnCards)}
                  disabled={loading}
                  className="mt-6 h-[44px] w-full rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ✨ AI解读牌意 →
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4" aria-live="polite">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5 md:p-6">
                <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] text-center mb-5">✨ 您抚到了这些牌</h3>
                <div>
                  {renderCards()}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 md:p-8">
                <h3 className="font-display text-xl tracking-[0.08em] text-[#1C1A16] mb-4">✨ AI 解读</h3>
                <div className="text-[#3D3A35] leading-relaxed text-sm whitespace-pre-wrap">
                  {result.reading}
                  {streaming && <span className="inline-block w-1 h-4 bg-[#1C1A16] ml-1 animate-pulse" />}
                </div>
                {!streaming && result.caution && (
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
                    onClick={() => handleAIReading(drawnCards)}
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

        <section className="mx-auto mt-12 max-w-5xl animate-fadeIn">
          <div className="text-center mb-10">
            <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16]">AI 塔罗牌解析系统</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
              CyberFate AI 塔罗牌占卜系统结合了传统塔罗牌智慧与尖端人工智能技术,通过78张牌的图像符号和 AI 精准分析来揭示人生的真相和智慧。我们的 AI 塔罗牌解读不仅融合了传统塔罗牌占卜技巧,还结合现代心理学理论,为您提供深入且实用的人生指引。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-4">
            {[
              {
                icon: '✶',
                title: 'AI 精准解读',
                desc: '人工智能分析塔罗牌象征意义,提供精准个性化的解读,激发您的直觉洞察力',
              },
              {
                icon: '⚡',
                title: '即时占卜反馈',
                desc: '无需等待,AI 系统即时生成专业塔罗牌解读,随时随地获取命运指引',
              },
              {
                icon: '☆',
                title: '专业塔罗智慧',
                desc: '基于传统塔罗牌理论,结合 AI 分析能力,为您的人生关键决策提供深刻洞见',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center rounded-2xl border border-[#E5E0D8] bg-white p-8"
              >
                <div className="w-14 h-14 rounded-full bg-[#F5F2ED] flex items-center justify-center text-2xl mb-5 flex-shrink-0">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-[#1C1A16] mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-5xl animate-fadeIn">
          <div className="text-center mb-10">
            <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16]">AI 塔罗牌占卜应用场景</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                title: '感情关系解析',
                desc: 'AI 塔罗牌占卜能帮助您理解当前感情状况和潜在发展方向,洞察伴侣想法和关系中的隐藏问题,为您的情感决策提供指引。',
              },
              {
                title: '事业发展预测',
                desc: '通过 AI 塔罗牌占卜分析当前职业环境和未来机遇,识别潜在障碍和有利因素,帮助您在职业道路上做出明智选择。',
              },
              {
                title: '重大决策指导',
                desc: '面临人生十字路口时,AI 塔罗牌占卜可以为您提供多角度思考,展示不同选择可能带来的结果,帮助您权衡利弊。',
              },
              {
                title: '自我成长探索',
                desc: 'AI 塔罗牌占卜能揭示您内心深处的真实想法,帮助您认识自己的潜能和盲点,指引个人成长和自我实现的方向。',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E5E0D8] bg-white p-8"
              >
                <h3 className="text-base font-semibold text-[#1C1A16] mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-5xl animate-fadeIn">
          <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16] text-center mb-10">AI 塔罗牌占卜常见问题</h2>
          <div className="space-y-4">
            {[
              {
                q: 'AI 塔罗牌占卜与传统塔罗牌有何不同？',
                a: 'AI 塔罗牌占卜结合了传统塔罗牌的象征体系和人工智能的分析能力，提供更客观、全面的解读。AI 能快速处理大量信息、找出牌阵中的关联和模式，同时保持塔罗牌的神秘性和直觉性。',
              },
              {
                q: '如何提出有效的塔罗牌问题？',
                a: '提出明确、具体但开放性的问题能获得更有价値的 AI 塔罗牌解读。避免简单的是非问题，更好的问法是“我如何能……”、“什么因素影响……”或“我需要了解什么关于……”这类引导深入思考的问题。',
              },
              {
                q: 'AI 塔罗牌占卜的准确性如何？',
                a: 'AI 塔罗牌占卜是一种引导性工具，其价値在于提供新的思考角度和个人反思的机会。我们的系统基于深度学习训练，能提供有深度的见解，但最终决策权和判断力仍在您手中。',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-[#E5E0D8] bg-white p-7">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1C1A16] mb-3">
                  <span className="text-[#6B7280] text-base">&#9432;</span>
                  {item.q}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-[#E5E0D8] bg-white/60 p-4 text-center text-xs text-[#9CA3AF]">
            ⚠️ 免责声明:本站塔罗占卜内容仅供娱乐与自我探索参考,不构成医疗、法律或投资建议。请结合现实信息理性判断。
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-5xl animate-fadeIn">
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] p-10 text-center md:p-16">
            <h2 className="font-display text-[32px] tracking-[0.06em] text-[#1C1A16] leading-tight">
              开启你的<br />AI 塔罗占卜之旅
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#6B7280]">
              赛博命理师的 AI 塔罗系统融合了传统塔罗智慧与现代 AI 技术,为你提供更准确、更有深度的解读。无论你是塔罗新手还是资深爱好者,都能从中获得启发。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-xl bg-[#1C1A16] px-10 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#2D2B26]"
              >
                开始 AI 塔罗占卜 →
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/bazi'; }}
                className="rounded-xl border border-[#E5E0D8] bg-white px-10 py-3.5 text-sm font-medium text-[#1C1A16] transition-all hover:bg-[#F5F2ED]"
              >
                八字分析 →
              </button>
            </div>
            <p className="mt-4 text-xs text-[#9CA3AF]">免费体验,无需注册</p>
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

    </div>
  );
}

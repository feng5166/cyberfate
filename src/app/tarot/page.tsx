'use client';

import { Footer } from '@/components/layout/Footer';
import { CardDrawAnimation } from '@/components/tarot/CardDrawAnimation';
import { ChevronDown, ChevronUp, Share2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const spreads = [
  {
    id: 'single',
    name: '单张牌',
    desc: '快速指引',
    detail: '适用于今日运势、快速决策',
    cards: 1,
    free: true,
    freeLimit: '每日 3 次',
  },
  {
    id: 'three',
    name: '三张牌',
    desc: '过去/现在/未来',
    detail: '了解事情发展脉络',
    cards: 3,
    free: true,
    freeLimit: '每日 1 次',
  },
  {
    id: 'celtic',
    name: '凯尔特十字',
    desc: '深度分析',
    detail: '重大决策、深度探索',
    cards: 10,
    free: false,
    freeLimit: 'VIP 专属',
  },
];

const THREE_POSITIONS = ['过去', '现在', '未来'];
const CELTIC_POSITIONS = [
  '现状',
  '挑战',
  '根源',
  '过去',
  '目标',
  '未来',
  '自我',
  '环境',
  '希望/恐惧',
  '结果',
];

const FEATURE_ITEMS = [
  {
    icon: '🃏',
    title: '多牌阵选择',
    desc: '从单张到凯尔特十字，覆盖快速指引与深度分析场景。',
  },
  {
    icon: '✨',
    title: 'AI 深度解读',
    desc: '基于抽牌结果生成结构化解读，帮助你快速抓住重点。',
  },
  {
    icon: '🌙',
    title: '场景化提问',
    desc: '支持感情、事业、学业等问题，提问越清晰，参考越具体。',
  },
  {
    icon: '🔮',
    title: '结果可分享',
    desc: '一键复制或系统分享你的抽牌结果，便于复盘与交流。',
  },
];

const FAQ_ITEMS = [
  {
    question: '塔罗占卜结果准确吗？',
    answer:
      '塔罗更适合作为自我觉察与反思工具。结果是参考视角，不建议作为唯一决策依据。',
  },
  {
    question: '不输入问题也可以抽牌吗？',
    answer:
      '可以。不填问题时系统会给出通用解读；若输入具体问题，解读会更贴近你的场景。',
  },
  {
    question: '凯尔特十字适合什么时候使用？',
    answer:
      '当你面对复杂选择、需要完整梳理内外因素与发展趋势时，凯尔特十字更合适。',
  },
];

interface TarotCard {
  id: string | number;
  name_en: string;
  name_zh: string;
  keywords: string[];
  orientation: 'upright' | 'reversed';
  image_url: string;
}

export default function TarotPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<'select' | 'question' | 'draw' | 'analyzing' | 'result'>('select');
  const [selectedSpread, setSelectedSpread] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ cards: TarotCard[]; ai_reading: string } | null>(null);
  const [error, setError] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const selectedSpreadMeta = spreads.find((spread) => spread.id === selectedSpread);

  const handleShare = async () => {
    if (!result) return;

    try {
      const res = await fetch('/api/tarot/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: result.cards,
          question,
          spread: selectedSpread,
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

  const handleSelectSpread = (spreadId: string) => {
    const spread = spreads.find((item) => item.id === spreadId);
    if (spread && !spread.free && !session) {
      window.location.href = '/auth/login?redirect=/tarot';
      return;
    }
    setSelectedSpread(spreadId);
    setStep('question');
  };

  const handleDraw = async () => {
    setStep('draw');
  };

  const handleCardsSelected = async (selectedIndices: number[]) => {
    void selectedIndices;
    setStep('analyzing');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread: selectedSpread, question }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为 VIP 专属功能');
          setStep('question');
          return;
        }
        throw new Error(data.error || '请求失败');
      }
      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setStep('question');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedSpread('');
    setQuestion('');
    setResult(null);
    setError('');
  };

  const renderCardGrid = () => {
    if (!result) return null;

    if (result.cards.length === 1) {
      const card = result.cards[0];
      return (
        <div className="mx-auto max-w-[260px] text-center">
          <div className="overflow-hidden rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-3">
            <Image
              src={card.image_url}
              alt={card.name_zh}
              width={220}
              height={360}
              className="mx-auto rounded-lg shadow-md"
            />
          </div>
          <h4 className="mt-4 text-base font-medium text-[#1C1A16]">{card.name_zh}</h4>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${
              card.orientation === 'upright' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {card.orientation === 'upright' ? '正位' : '逆位'}
          </span>
        </div>
      );
    }

    if (result.cards.length === 3) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {result.cards.map((card, idx) => (
            <div
              key={`${card.id}-${idx}`}
              className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4 text-center"
            >
              <p className="mb-3 text-xs tracking-[0.18em] text-[#1C1A16]/55">{THREE_POSITIONS[idx]}</p>
              <Image
                src={card.image_url}
                alt={card.name_zh}
                width={160}
                height={256}
                className="mx-auto rounded-lg shadow-md"
              />
              <h4 className="mt-3 text-sm font-medium text-[#1C1A16]">{card.name_zh}</h4>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${
                  card.orientation === 'upright' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {card.orientation === 'upright' ? '正位' : '逆位'}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {result.cards.map((card, idx) => (
          <div key={`${card.id}-${idx}`} className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-3 text-center">
            <p className="mb-2 text-[11px] tracking-[0.12em] text-[#1C1A16]/50">{CELTIC_POSITIONS[idx]}</p>
            <Image
              src={card.image_url}
              alt={card.name_zh}
              width={120}
              height={186}
              className="mx-auto rounded-md shadow-sm"
            />
            <h4 className="mt-2 text-xs font-medium text-[#1C1A16]">{card.name_zh}</h4>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                card.orientation === 'upright' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {card.orientation === 'upright' ? '正位' : '逆位'}
            </span>
          </div>
        ))}
      </div>
    );
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
        <section className="mx-auto max-w-5xl pt-24 pb-12 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(44px,6vw,60px)] leading-tight tracking-[0.08em] text-[#1C1A16]">
            塔罗占卜
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed tracking-[0.06em] text-[#1C1A16]/42">
            静心提问，让每一张牌为你打开新的观察角度。
          </p>
          <p className='mx-auto mt-4 max-w-xl text-xs text-[#1C1A16]/45 [font-family:var(--font-display-secondary),"Noto_Serif_SC",serif]'>
            “塔罗给出的不是命令，而是你与当下之间的一面镜子。”
          </p>
        </section>

        <section className="mx-auto max-w-5xl animate-fadeIn">
          {step === 'select' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {spreads.map((spread) => (
                <button
                  key={spread.id}
                  type="button"
                  onClick={() => handleSelectSpread(spread.id)}
                  className="group rounded-2xl border border-[#1C1A16]/8 bg-white p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-2xl">{spread.cards === 1 ? '🃏' : spread.cards === 3 ? '🃏🃏🃏' : '🃏×10'}</span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                        spread.free ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {spread.freeLimit}
                    </span>
                  </div>
                  <h3 className="font-display text-[24px] text-[#1C1A16]">{spread.name}</h3>
                  <p className="mt-2 text-sm text-[#1C1A16]/68">{spread.desc}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#1C1A16]/42">{spread.detail}</p>
                </button>
              ))}
            </div>
          )}

          {step === 'question' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover md:p-8">
              <div className="mb-6 text-center">
                <span className="inline-flex rounded-full border border-[#1C1A16]/12 bg-[#FAF9F6] px-3 py-1 text-xs tracking-[0.16em] text-[#1C1A16]/60">
                  {selectedSpreadMeta?.name}
                </span>
              </div>

              <label className="mb-2 block text-sm text-[#1C1A16]/70">你想问什么？（选填）</label>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                  placeholder="可以问感情、事业、关系、时机等，越具体越容易得到有效参考"
                  className="min-h-[100px] max-h-[200px] w-full resize-y rounded-xl border border-[#1C1A16]/14 p-4 pr-14 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/35 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/8"
                  maxLength={200}
                />
                <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-[#1C1A16]/42">
                  {question.length}/200
                </span>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-[#1C1A16]/15 bg-transparent px-[38px] py-[14px] text-[13px] tracking-[0.12em] text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleDraw}
                  disabled={loading}
                  className="rounded-xl bg-[#1C1A16] px-[38px] py-[14px] text-[13px] tracking-[0.12em] text-white transition-all hover:-translate-y-1 hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-65"
                >
                  开始抽牌
                </button>
              </div>
            </div>
          )}

          {step === 'draw' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover md:p-8">
              <CardDrawAnimation
                cardCount={spreads.find((spread) => spread.id === selectedSpread)?.cards || 1}
                onComplete={handleCardsSelected}
              />
            </div>
          )}

          {step === 'analyzing' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-8 text-center transition-shadow duration-300 hover:shadow-card-hover md:p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF9F6]">
                <Sparkles className="h-7 w-7 animate-spin text-[#1C1A16]" />
              </div>
              <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">正在解读中...</h3>
              <p className="mt-3 text-sm text-[#1C1A16]/55">AI 正在结合牌阵结构与牌意，为你生成本次解读。</p>
              <div className="mt-5 flex justify-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1C1A16]/70" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5 transition-shadow duration-300 hover:shadow-card-hover md:p-7">
                <h3 className="mb-4 font-display text-2xl tracking-[0.08em] text-[#1C1A16]">牌面展示</h3>
                {renderCardGrid()}
              </div>

              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover md:p-7">
                <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">塔罗解读</h3>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#1C1A16]/78">{result.ai_reading}</p>
              </div>

              {result.cards.length === 1 && (
                <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover md:p-7">
                  <h3 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">牌意详解</h3>
                  <p className="mt-3 text-xs tracking-[0.12em] text-[#1C1A16]/42">关键词</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.cards[0].keywords.map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="inline-flex rounded-full border border-[#1C1A16]/10 bg-[#FAF9F6] px-3 py-1 text-xs text-[#1C1A16]/75"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:justify-center">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center rounded-xl border border-[#1C1A16]/15 bg-transparent px-[38px] py-[14px] text-[13px] tracking-[0.12em] text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  分享结果
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-[#1C1A16]/15 bg-transparent px-[38px] py-[14px] text-[13px] tracking-[0.12em] text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  再来一次
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mx-auto mt-10 max-w-5xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.08em] text-[#1C1A16]">特色功能</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {FEATURE_ITEMS.map((item) => (
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
              const expanded = expandedFaqIndex === index;
              return (
                <div key={item.question} className="rounded-2xl border border-[#1C1A16]/10 bg-white px-4 py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpandedFaqIndex((prev) => (prev === index ? null : index))}
                  >
                    <span className="text-sm font-medium text-[#1C1A16]">{item.question}</span>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-[#1C1A16]/45" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#1C1A16]/45" />
                    )}
                  </button>
                  {expanded && (
                    <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/75">{item.answer}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-white p-3 text-center text-xs text-[#1C1A16]/45">
            ⚠️ 免责声明：本站塔罗占卜内容仅供娱乐与自我探索参考，不构成医疗、法律或投资建议。请结合现实信息理性判断。
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

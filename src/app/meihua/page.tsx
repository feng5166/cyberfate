'use client';

import { Footer } from '@/components/layout/Footer';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Method = 'time' | 'number' | 'manual';

interface GuaMeta {
  name: string;
  symbol: string;
  meaning: string;
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

const EXAMPLE_QUESTIONS = [
  '我是否应该接受这份工作机会？',
  '今天适合签约吗？',
  '这段感情值得继续吗？',
];

const METHOD_OPTIONS: Array<{ value: Method; label: string }> = [
  { value: 'time', label: '时间起卦' },
  { value: 'number', label: '数字起卦' },
  { value: 'manual', label: '手动起卦' },
];

const FEATURE_ITEMS = [
  {
    icon: '🎯',
    title: '多角度观察',
    desc: '结合易理框架的多层次洞察，既看文化背景又看实际落地。',
  },
  {
    icon: '✨',
    title: '个性化参考',
    desc: '基于您的问题和当前状态提供定制化的参考要点。',
  },
  {
    icon: '💬',
    title: '清晰表达',
    desc: '用简洁易懂的语言将传统文化转化为易于理解的参考信息。',
  },
  {
    icon: '🔮',
    title: '模式观察',
    desc: 'AI 易数系统尝试捕捉模式化线索，供您思考参考。',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '梅花易数的参考价值如何？',
    answer:
      '梅花易数是中国古代占卜方法之一，基于《易经》八卦体系。我们结合传统易理和现代 AI 分析提供参考视角，但任何占卜结果仅供参考，不做唯一决策依据。',
  },
  {
    question: 'AI 的辅助解读可靠吗？',
    answer:
      '我们的 AI 解读基于梅花易数的传统规则库和现代语言模型共同生成，融合古代智慧与现代分析视角。建议作为辅助参考，不替代现实信息与专业建议。',
  },
  {
    question: '哪类问题适合这个系统？',
    answer:
      '面临选择、需要额外视角的问题都适合尝试。问题描述越具体，参考质量越高。涉及医疗、法律等专业领域时，请优先咨询专业人士。',
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

function stanceMeta(stance: MeihuaDecisionResult['stance']) {
  if (stance === 'go') {
    return {
      label: '倾向去做',
      className: 'bg-green-100 text-green-700',
      keywordClass: 'text-green-700',
    };
  }
  if (stance === 'stop') {
    return {
      label: '倾向不做',
      className: 'bg-red-100 text-red-700',
      keywordClass: 'text-red-700',
    };
  }
  return {
    label: '建议观望',
    className: 'bg-amber-100 text-amber-700',
    keywordClass: 'text-amber-700',
  };
}

export default function MeihuaPage() {
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState<Method>('time');
  const [numbers, setNumbers] = useState({ num1: '', num2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MeihuaDrawResult | null>(null);
  const [decision, setDecision] = useState<MeihuaDecisionResult | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const count = question.length;
  const isQuestionMode = Boolean(question.trim());

  const decisionMeta = useMemo(
    () => (decision ? stanceMeta(decision.stance) : null),
    [decision]
  );

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

    try {
      const drawRes = await fetch('/api/meihua/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, numbers }),
      });

      const drawData = (await drawRes.json()) as MeihuaDrawResult;
      if (!drawRes.ok) {
        throw new Error(drawData.error || '起卦失败，请稍后重试。');
      }

      setResult(drawData);

      if (isQuestionMode) {
        const decideRes = await fetch('/api/meihua/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim(), draw: drawData }),
        });

        const decideData = (await decideRes.json()) as MeihuaDecisionResult;
        if (!decideRes.ok) {
          setError((decideData as { error?: string }).error || '已完成起卦，AI 决策建议暂不可用。');
          return;
        }

        setDecision(decideData);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '起卦失败，请稍后重试。');
    } finally {
      setLoading(false);
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
            <h2 className="font-display text-xl text-[#1C1A16]">提出您的决策问题</h2>
            <p className="mt-2 text-xs text-[#1C1A16]/60 md:text-sm">
              问题可选填：不填则进入传统起卦模式；填写后将生成 AI 决策建议。
            </p>

            <div className="mt-4">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                  maxLength={200}
                  placeholder="输入一个令你纠结的问题，系统将自动为你起卦..."
                  className="min-h-[100px] max-h-[200px] w-full resize-y rounded-xl border border-gray-300 p-4 pr-14 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/45 focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-[#1C1A16]/55">
                  {count}/200
                </span>
              </div>

              {!question.trim() && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXAMPLE_QUESTIONS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setQuestion(example)}
                      className="cursor-pointer rounded-full bg-gray-50 px-3 py-1.5 text-xs text-[#1C1A16]/65 transition-colors hover:bg-gray-100"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs text-[#1C1A16]/60">起卦方式</p>
              <div className="grid grid-cols-3 rounded-xl bg-gray-100 p-1">
                {METHOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMethod(option.value)}
                    className={`h-9 rounded-lg text-xs font-medium transition-colors md:text-sm ${
                      method === option.value
                        ? 'bg-[#1C1A16] text-white'
                        : 'text-[#1C1A16]/70 hover:bg-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
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
              disabled={loading}
              className="mt-5 flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:bg-[#2A2621] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在解卦...
                </>
              ) : (
                '🀄 开始解卦'
              )}
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </section>

        {result && (
          <section className="mx-auto mt-8 max-w-4xl space-y-4 animate-fadeIn">
            <div className="rounded-2xl bg-white p-6 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
              <h3 className="text-sm font-medium text-[#1C1A16]/70">卦象信息</h3>

              <div className="mt-3 flex flex-col items-start gap-2 text-[#1C1A16] md:flex-row md:items-center">
                <div className="text-xl font-semibold">
                  {result.primary?.guaSymbol || result.gua.replace('\n', '')} {result.primary?.guaName || result.guaName}
                </div>
                <span className="text-[#1C1A16]/40">→</span>
                <div className="text-xl font-semibold text-[#1C1A16]/85">
                  {result.changed?.guaSymbol || (result.changedGua || result.gua).replace('\n', '')}{' '}
                  {result.changed?.guaName || result.changedGuaName || result.guaName}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#1C1A16]/70">
                <span>
                  上卦：{result.primary?.upper.symbol || ''}
                  {result.primary?.upper.name || result.upper || '未知'}
                  {result.primary?.upper.meaning ? `（${result.primary?.upper.meaning}）` : ''}
                </span>
                <span>
                  下卦：{result.primary?.lower.symbol || ''}
                  {result.primary?.lower.name || result.lower || '未知'}
                  {result.primary?.lower.meaning ? `（${result.primary?.lower.meaning}）` : ''}
                </span>
                <span>动爻：第{result.movingLine ?? 0}爻</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#1C1A16]/75">
                卦辞：{result.guaCi || firstSentence(result.analysis)}
              </p>
            </div>

            {decision && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                  <Brain className="h-6 w-6 text-[#3B82F6]" />
                  <h4 className="mt-3 text-base font-semibold text-[#1C1A16]">思考参考</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/70">
                    {decision.insights.thinkingReference}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                  <Sparkles className="h-6 w-6 text-[#8B5CF6]" />
                  <h4 className="mt-3 text-base font-semibold text-[#1C1A16]">卦象分析</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/70">
                    {decision.insights.guaAnalysis}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                  <Clock3 className="h-6 w-6 text-[#22C55E]" />
                  <h4 className="mt-3 text-base font-semibold text-[#1C1A16]">时机参考</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/70">
                    {decision.insights.timingReference}
                  </p>
                </div>
              </div>
            )}

            {isQuestionMode && decision && decisionMeta && (
              <div className="rounded-2xl bg-white p-6 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-base font-semibold text-[#1C1A16]">决策建议</h3>

                <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/85">
                  综合建议：
                  <span className={`mx-1 inline-flex rounded-full px-2.5 py-0.5 text-xs ${decisionMeta.className}`}>
                    {decisionMeta.label}
                  </span>
                  <span className={decisionMeta.keywordClass}>{decision.overallAdvice}</span>
                </p>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-green-700">✓ 有利因素</h4>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-green-700">
                    {decision.favorable.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-amber-700">⚠ 需要注意</h4>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-amber-700">
                    {decision.cautions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-blue-700">💡 下一步行动</h4>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-blue-700">
                    {decision.nextSteps.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
              <h3 className="text-base font-semibold text-[#1C1A16]">
                {isQuestionMode ? '基础卦象解读' : '卦象解读'}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1C1A16]/75">{result.analysis}</p>
            </div>
          </section>
        )}

        <section className="mx-auto mt-8 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">特色功能</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {FEATURE_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-none transition-shadow duration-300 hover:shadow-card-hover">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF9F6] text-base">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1C1A16]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#1C1A16]/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-4xl pb-4 animate-fadeIn">
          <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">常见问题</h2>
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
                      <ChevronUp className="h-4 w-4 text-[#6B7280]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#6B7280]" />
                    )}
                  </button>
                  {expanded && (
                    <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/78">{item.answer}</p>
                  )}
                </div>
              );
            })}
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

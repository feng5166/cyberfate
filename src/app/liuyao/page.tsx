'use client';

import { Footer } from '@/components/layout/Footer';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ─── 八卦数据 ─────────────────────────────────────

interface TrigramInfo {
  name: string;
  symbol: string;
  nature: string;
  lines: [number, number, number]; // 从下到上: 0=阴, 1=阳
}

const TRIGRAMS_MAP: Record<string, TrigramInfo> = {
  qian: { name: '乾', symbol: '☰', nature: '天', lines: [1, 1, 1] },
  dui:  { name: '兑', symbol: '☱', nature: '泽', lines: [1, 1, 0] },
  li:   { name: '离', symbol: '☲', nature: '火', lines: [1, 0, 1] },
  zhen: { name: '震', symbol: '☳', nature: '雷', lines: [1, 0, 0] },
  xun:  { name: '巽', symbol: '☴', nature: '风', lines: [0, 1, 1] },
  kan:  { name: '坎', symbol: '☵', nature: '水', lines: [0, 1, 0] },
  gen:  { name: '艮', symbol: '☶', nature: '山', lines: [0, 0, 1] },
  kun:  { name: '坤', symbol: '☷', nature: '地', lines: [0, 0, 0] },
};

const HEXAGRAM_MAP: Record<string, Record<string, string>> = {
  qian: { qian: '乾为天', dui: '天泽履', li: '天火同人', zhen: '天雷无妄', xun: '天风姤', kan: '天水讼', gen: '天山遁', kun: '天地否' },
  dui:  { qian: '泽天夬', dui: '兑为泽', li: '泽火革', zhen: '泽雷随', xun: '泽风大过', kan: '泽水困', gen: '泽山咸', kun: '泽地萃' },
  li:   { qian: '火天大有', dui: '火泽睽', li: '离为火', zhen: '火雷噬嗑', xun: '火风鼎', kan: '火水未济', gen: '火山旅', kun: '火地晋' },
  zhen: { qian: '雷天大壮', dui: '雷泽归妹', li: '雷火丰', zhen: '震为雷', xun: '雷风恒', kan: '雷水解', gen: '雷山小过', kun: '雷地豫' },
  xun:  { qian: '风天小畜', dui: '风泽中孚', li: '风火家人', zhen: '风雷益', xun: '巽为风', kan: '风水涣', gen: '风山渐', kun: '风地观' },
  kan:  { qian: '水天需', dui: '水泽节', li: '水火既济', zhen: '水雷屯', xun: '水风井', kan: '坎为水', gen: '水山蹇', kun: '水地比' },
  gen:  { qian: '山天大畜', dui: '山泽损', li: '山火贲', zhen: '山雷颐', xun: '山风蛊', kan: '山水蒙', gen: '艮为山', kun: '山地剥' },
  kun:  { qian: '地天泰', dui: '地泽临', li: '地火明夷', zhen: '地雷复', xun: '地风升', kan: '地水师', gen: '地山谦', kun: '坤为地' },
};

// ─── 类型定义 ─────────────────────────────────────

type DivinationMethod = 'manual' | 'coin' | 'time' | 'number';
type LineValue = 0 | 1 | null; // 0=阴, 1=阳, null=未选

interface LineResult {
  index: number;
  type: 'yin' | 'yang';
  title: string;
  originalText: string;
  interpretation: string;
}

interface LiuYaoResult {
  hexagramName: string;
  upperTrigram: string;
  lowerTrigram: string;
  upperSymbol: string;
  lowerSymbol: string;
  lines: LineResult[];
  judgment: string;
  actionAdvice: {
    summary: string;
    positives: string[];
    cautions: string[];
    actions: string[];
  };
  overallNarrative: string;
}

const SAMPLE_QUESTIONS = [
  '我近期的工作运势如何？',
  '这件事能成吗？',
  '他和我的关系走向？',
  '最近需要注意什么？',
];

const METHOD_OPTIONS: Array<{ value: DivinationMethod; label: string; icon: string; enabled: boolean }> = [
  { value: 'manual', label: '手动起卦', icon: '✋', enabled: true },
  { value: 'coin', label: '铜钱起卦', icon: '🪙', enabled: false },
  { value: 'time', label: '时间起卦', icon: '⏰', enabled: false },
  { value: 'number', label: '数字起卦', icon: '🔢', enabled: false },
];

const LINE_LABELS = ['上六爻', '五爻', '四爻', '三爻', '二爻', '初爻'];

const FAQ_ITEMS = [
  {
    q: '六爻占卜和塔罗有什么区别？',
    a: '六爻占卜源自《周易》，通过阴阳爻的组合形成六十四卦，侧重事物发展的趋势分析。塔罗牌则是西方占卜体系，通过牌面图像和位置进行解读。两者各有特色，可以互相补充参考。',
  },
  {
    q: '如何选择阴爻和阳爻？',
    a: '可以根据直觉选择，也可以心中默念问题后随意选取。传统上阳爻代表阳刚、积极、动态，阴爻代表阴柔、被动、静态。选择时保持心态平静，不必过分纠结。',
  },
  {
    q: 'AI 六爻解读可靠吗？',
    a: '我们的 AI 解读融合了传统易理知识库和现代语言模型，力求在尊重传统的基础上提供清晰易懂的分析。结果仅供参考，建议结合实际情况理性判断。',
  },
] as const;

// ─── 辅助组件 ─────────────────────────────────────

function YaoLine({ type, height = 6, width = '80%' }: { type: 'yin' | 'yang'; height?: number; width?: string }) {
  if (type === 'yang') {
    return (
      <div className="flex justify-center">
        <div
          className="rounded-sm bg-[#1C1A16]"
          style={{ height: `${height}px`, width }}
        />
      </div>
    );
  }
  return (
    <div className="flex justify-center" style={{ width }}>
      <div className="mx-auto flex items-center justify-between" style={{ width }}>
        <div className="rounded-sm bg-[#1C1A16]" style={{ height: `${height}px`, width: '35%' }} />
        <div style={{ width: '30%' }} />
        <div className="rounded-sm bg-[#1C1A16]" style={{ height: `${height}px`, width: '35%' }} />
      </div>
    </div>
  );
}

function HexagramFigure({ lines, size = 'normal' }: { lines: (0 | 1)[]; size?: 'normal' | 'large' }) {
  const h = size === 'large' ? 8 : 6;
  const gap = size === 'large' ? 'gap-2' : 'gap-1.5';
  const w = size === 'large' ? '100px' : '72px';

  return (
    <div className={`flex flex-col-reverse ${gap}`} style={{ width: w }}>
      {lines.map((line, i) => (
        <YaoLine key={i} type={line === 1 ? 'yang' : 'yin'} height={h} width="100%" />
      ))}
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────

export default function LiuYaoPage() {
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState<DivinationMethod>('manual');
  const [lineSelections, setLineSelections] = useState<LineValue[]>([null, null, null, null, null, null]);
  const [divinationTime, setDivinationTime] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const allLinesSelected = lineSelections.every((v) => v !== null);

  // 从lineSelections推导卦象预览（初爻→上爻顺序即index 0→5）
  // 但UI显示是从上六爻到初爻（反序）
  const previewLines = useMemo(() => {
    return lineSelections as (0 | 1 | null)[];
  }, [lineSelections]);

  const lowerTrigram = useMemo(() => {
    const [l0, l1, l2] = previewLines.slice(0, 3);
    if (l0 === null || l1 === null || l2 === null) return null;
    return Object.values(TRIGRAMS_MAP).find(
      (t) => t.lines[0] === l0 && t.lines[1] === l1 && t.lines[2] === l2
    ) || null;
  }, [previewLines]);

  const upperTrigram = useMemo(() => {
    const [l3, l4, l5] = previewLines.slice(3, 6);
    if (l3 === null || l4 === null || l5 === null) return null;
    return Object.values(TRIGRAMS_MAP).find(
      (t) => t.lines[0] === l3 && t.lines[1] === l4 && t.lines[2] === l5
    ) || null;
  }, [previewLines]);

  const hexagramName = useMemo(() => {
    if (!upperTrigram || !lowerTrigram) return null;
    const upperKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === upperTrigram)?.[0];
    const lowerKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === lowerTrigram)?.[0];
    if (!upperKey || !lowerKey) return null;
    return HEXAGRAM_MAP[upperKey]?.[lowerKey] || null;
  }, [upperTrigram, lowerTrigram]);

  const setLine = useCallback((displayIndex: number, value: 0 | 1) => {
    // displayIndex: 0=上六爻, 5=初爻 → 实际index: 5-displayIndex
    const actualIndex = 5 - displayIndex;
    setLineSelections((prev) => {
      const next = [...prev];
      next[actualIndex] = value;
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!allLinesSelected) {
      setError('请先选择全部 6 爻的阴阳属性');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const lines = lineSelections as number[];
    const upperKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === upperTrigram)?.[0] || '';
    const lowerKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === lowerTrigram)?.[0] || '';

    try {
      const res = await fetch('/api/liuyao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          hexagrams: { upper: upperKey, lower: lowerKey, lines },
          method,
          divinationTime: new Date(divinationTime).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '请求失败，请稍后重试。');
      }

      const data = (await res.json()) as LiuYaoResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLineSelections([null, null, null, null, null, null]);
    setQuestion('');
    setError('');
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    setDivinationTime(local.toISOString().slice(0, 16));
  };

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
        {/* ① 标题区 */}
        <section className="mx-auto max-w-4xl pt-24 pb-10 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(36px,5vw,56px)] leading-tight tracking-[0.08em] text-[#1C1A16]">
            AI 六爻占卜 · 智能预测分析
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-[#1C1A16]/55 md:text-base">
            融合传统六爻占卜与人工智能技术，为你提供更深度的卦象分析和趋势预测。
          </p>
        </section>

        <section className="mx-auto max-w-4xl space-y-4 animate-fadeIn">
          {/* ② 问题输入区 */}
          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
            <label className="mb-2 block text-sm text-[#1C1A16]/75">你的问题</label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                placeholder="最想咨询的问题或主题..."
                maxLength={200}
                className="min-h-[100px] max-h-[200px] w-full resize-y rounded-xl border border-gray-300 p-4 pb-7 text-sm text-[#1C1A16] outline-none transition-all placeholder:text-[#1C1A16]/35 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#1C1A16]/45">
                {question.length}/200
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((item) => (
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
          </div>

          {/* ③ 起卦方式选择 */}
          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
            <h3 className="text-base font-semibold text-[#1C1A16] mb-3">起卦方式</h3>
            <div className="grid grid-cols-4 gap-2">
              {METHOD_OPTIONS.map((opt) => {
                const isActive = method === opt.value;
                const disabled = !opt.enabled;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => opt.enabled && setMethod(opt.value)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-200 ${
                      isActive
                        ? 'border-[#1C1A16]/20 bg-[#1C1A16] text-white shadow-sm'
                        : disabled
                          ? 'cursor-not-allowed border-[#1C1A16]/5 bg-gray-50 text-[#1C1A16]/30'
                          : 'border-[#1C1A16]/10 bg-white text-[#1C1A16] hover:border-[#1C1A16]/20 hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                    {disabled && (
                      <span className="text-[10px] text-[#1C1A16]/30">即将上线</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ④ 手动起卦面板 */}
          {method === 'manual' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              <h3 className="text-base font-semibold text-[#1C1A16] mb-1">手动起卦</h3>
              <p className="text-xs text-[#1C1A16]/55 mb-4">请从上到下依次选择六爻的阴阳</p>

              <div className="flex flex-col gap-4 md:flex-row md:gap-8">
                {/* 左侧：爻选择器 */}
                <div className="flex-1 space-y-3">
                  {LINE_LABELS.map((label, displayIdx) => {
                    const actualIdx = 5 - displayIdx;
                    const value = lineSelections[actualIdx];
                    return (
                      <div key={displayIdx} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-sm text-[#1C1A16]/60">{label}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setLine(displayIdx, 0)}
                            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
                              value === 0
                                ? 'border-[#1C1A16]/20 bg-[#1C1A16] text-white'
                                : 'border-[#1C1A16]/10 text-[#1C1A16]/60 hover:border-[#1C1A16]/20'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-[2px] w-2 bg-current" />
                              <span className="inline-block h-[2px] w-[3px] bg-transparent" />
                              <span className="inline-block h-[2px] w-2 bg-current" />
                            </span>
                            阴爻
                          </button>
                          <button
                            type="button"
                            onClick={() => setLine(displayIdx, 1)}
                            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
                              value === 1
                                ? 'border-[#1C1A16]/20 bg-[#1C1A16] text-white'
                                : 'border-[#1C1A16]/10 text-[#1C1A16]/60 hover:border-[#1C1A16]/20'
                            }`}
                          >
                            <span className="inline-block h-[2px] w-5 bg-current" />
                            阳爻
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 右侧：卦象预览 */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-6 md:w-[220px]">
                  <p className="mb-3 text-xs text-[#1C1A16]/50">卦象预览</p>
                  {allLinesSelected ? (
                    <>
                      <HexagramFigure lines={lineSelections as (0 | 1)[]} size="large" />
                      <div className="mt-4 text-center">
                        {upperTrigram && lowerTrigram && (
                          <div className="flex items-center justify-center gap-2 text-2xl">
                            <span>{upperTrigram.symbol}</span>
                            <span>{lowerTrigram.symbol}</span>
                          </div>
                        )}
                        {hexagramName && (
                          <p className="mt-1 text-sm font-semibold text-[#1C1A16]">{hexagramName}</p>
                        )}
                        {upperTrigram && lowerTrigram && (
                          <p className="mt-1 text-xs text-[#1C1A16]/55">
                            上{upperTrigram.name}（{upperTrigram.nature}）下{lowerTrigram.name}（{lowerTrigram.nature}）
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-[#1C1A16]/40">纯静卦</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-[120px] flex-col items-center justify-center">
                      <div className="space-y-2 opacity-20">
                        {[0, 1, 2, 3, 4, 5].map((i) => {
                          const actualIdx = 5 - i;
                          const v = lineSelections[actualIdx];
                          if (v === null) {
                            return (
                              <div key={i} className="h-[6px] w-[72px] rounded-sm border border-dashed border-[#1C1A16]/30" />
                            );
                          }
                          return (
                            <div key={i} className="opacity-100">
                              <YaoLine type={v === 1 ? 'yang' : 'yin'} height={6} width="72px" />
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-[#1C1A16]/40">请选择六爻</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ⑤ 占卜时间 + ⑥ 解卦按钮 */}
          {!result && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              <div className="mb-4">
                <label className="mb-1 block text-sm text-[#1C1A16]/75">占卜时间</label>
                <input
                  type="datetime-local"
                  value={divinationTime}
                  onChange={(e) => setDivinationTime(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-[#1C1A16] outline-none focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 md:w-auto"
                />
                <p className="mt-1 text-xs text-[#1C1A16]/45">占卜时间会影响卦象的时效性参考</p>
              </div>

              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !allLinesSelected}
                className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:bg-[#2A2621] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在解卦...
                  </>
                ) : (
                  '开始解卦 🔮'
                )}
              </button>
              {!allLinesSelected && method === 'manual' && (
                <p className="mt-2 text-center text-xs text-[#1C1A16]/45">请先选择全部 6 爻</p>
              )}
            </div>
          )}

          {/* ⑦ 解卦结果区 */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* ⑦-a 本卦信息卡 */}
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-sm font-medium text-[#1C1A16]/60 mb-3">卦象信息</h3>
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl leading-none">
                      {result.upperSymbol}{result.lowerSymbol}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#1C1A16]">{result.hexagramName}</h2>
                      <p className="mt-0.5 text-sm text-[#1C1A16]/60">
                        上卦：{result.upperTrigram} · 下卦：{result.lowerTrigram}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center gap-6 md:flex-row md:justify-center">
                  <div className="text-center">
                    <p className="mb-2 text-xs text-[#1C1A16]/50">本卦</p>
                    <HexagramFigure lines={lineSelections as (0 | 1)[]} size="large" />
                    <p className="mt-2 text-sm font-medium text-[#1C1A16]">{result.hexagramName}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[#1C1A16]/70">
                  <span className="font-medium text-[#1C1A16]">卦辞：</span>{result.judgment}
                </p>
              </div>

              {/* ⑦-b 各爻详解 */}
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-base font-semibold text-[#1C1A16] mb-4">各爻详解</h3>
                <div className="space-y-0">
                  {result.lines.map((line, idx) => (
                    <div
                      key={line.index}
                      className={`p-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === result.lines.length - 1 ? 'rounded-b-xl' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-[#1C1A16]">
                          {line.title}（第{line.index + 1}爻）
                        </span>
                      </div>
                      <div className="mb-2">
                        <YaoLine
                          type={line.type}
                          height={8}
                          width="120px"
                        />
                      </div>
                      <p className="text-xs italic text-[#1C1A16]/50 mb-2">
                        {line.originalText}
                      </p>
                      <p className="text-sm leading-relaxed text-[#1C1A16]/80">
                        {line.interpretation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⑦-d 行动建议 */}
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-base font-semibold text-[#1C1A16] mb-3">💡 六爻指引</h3>
                <p className="text-sm leading-relaxed text-[#1C1A16]/85 mb-4">
                  {result.actionAdvice.summary}
                </p>

                <div className="space-y-3">
                  {result.actionAdvice.positives.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-1">✓ 有利因素</h4>
                      <ul className="space-y-1 pl-1">
                        {result.actionAdvice.positives.map((item, i) => (
                          <li key={i} className="text-sm leading-relaxed text-green-700">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.actionAdvice.cautions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-amber-700 mb-1">⚠ 注意事项</h4>
                      <ul className="space-y-1 pl-1">
                        {result.actionAdvice.cautions.map((item, i) => (
                          <li key={i} className="text-sm leading-relaxed text-amber-700">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.actionAdvice.actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1">💡 下一步行动</h4>
                      <div className="space-y-1">
                        {result.actionAdvice.actions.map((item, i) => (
                          <p key={i} className="text-sm leading-relaxed text-blue-700">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 综合分析 */}
              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-base font-semibold text-[#1C1A16] mb-3">综合分析</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1C1A16]/75">
                  {result.overallNarrative}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-[#1C1A16]/15 bg-transparent px-8 py-3 text-sm text-[#1C1A16] transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  再来一卦
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ⑧ 特色功能介绍 */}
        <section className="mx-auto mt-10 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">AI 六爻占卜应用场景</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: '🎯', title: '事业决策', desc: '工作变动、项目前景、合作关系等事业相关问题的趋势分析。' },
              { icon: '💕', title: '感情分析', desc: '感情走向、关系发展、婚姻状况等情感问题的深度解读。' },
              { icon: '💰', title: '财运预测', desc: '投资时机、财务规划、收益趋势等财运相关的参考建议。' },
              { icon: '🔮', title: '趋势预测', desc: '事物发展趋势、时机把握、吉凶判断等综合性预测分析。' },
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

        {/* ⑨ FAQ */}
        <section className="mx-auto mt-8 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-xl tracking-[0.08em] text-[#1C1A16]">常见问题</h2>
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
          <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-white p-3 text-center text-xs text-[#1C1A16]/45">
            ⚠️ 免责声明：本站六爻占卜内容仅供娱乐与自我探索参考，不构成医疗、法律或投资建议。请结合现实信息理性判断。
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

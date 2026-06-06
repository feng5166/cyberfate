'use client';

import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OracleLoading } from '@/components/ui/OracleLoading';

const Footer = dynamic(() => import('@/components/layout/Footer').then(m => m.Footer), { ssr: false });
const AiDisclaimer = dynamic(() => import('@/components/ui/AiDisclaimer').then(m => m.AiDisclaimer), { ssr: false });

// ─── 八卦数据 ─────────────────────────────────────

interface TrigramInfo {
  name: string;
  symbol: string;
  nature: string;
  lines: [number, number, number];
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

const TRIGRAM_KEYS = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

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
type LineValue = 0 | 1 | null;

// 铜钱单爻结果: 6=老阴(动), 7=少阳, 8=少阴, 9=老阳(动)
type CoinLineResult = { coins: boolean[]; value: 6 | 7 | 8 | 9; yinYang: 0 | 1; isMoving: boolean };

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

const METHOD_OPTIONS: Array<{ value: DivinationMethod; label: string; icon: string }> = [
  { value: 'manual', label: '手动起卦', icon: '✋' },
  { value: 'coin', label: '铜钱起卦', icon: '🪙' },
  { value: 'time', label: '时间起卦', icon: '⏰' },
  { value: 'number', label: '数字起卦', icon: '🔢' },
];

const LINE_LABELS = ['上六爻', '五爻', '四爻', '三爻', '二爻', '初爻'];

const FAQ_ITEMS = [
  {
    q: 'AI 六爻占卜的准确性如何？',
    a: '六爻占卜是中国传统易学的核心预测方法，起源于汉代京房，历经千年传承。我们结合 AI 技术对六爻卦象进行深度解析、提供多角度分析，但最终决策仍应由您自己做出。',
  },
  {
    q: 'AI 如何提升六爻占卜的分析质量？',
    a: '我们的 AI 系统经过大量六爻易学资料训练，深度理解纳甲体系、六神理论等传统六爻核心理论。AI 能够快速分析复杂的世应关系、六亲配置，提供更全面、客观的六爻预测分析。',
  },
  {
    q: '适合用六爻占卜分析哪类问题？',
    a: '六爻占卜适合分析各类人生重要决策问题，包括事业发展、感情婚姻、财运投资、健康状况、时机选择等。它尤其适合需要精准预测和深度分析的复杂人生问题。',
  },
] as const;

// ─── 辅助函数 ─────────────────────────────────────

function getTrigramKeyByIndex(idx: number): string {
  return TRIGRAM_KEYS[((idx % 8) + 8) % 8];
}

function getTrigramInfoByKey(key: string): TrigramInfo {
  return TRIGRAMS_MAP[key] || TRIGRAMS_MAP.qian;
}

function resolveHexagram(upperKey: string, lowerKey: string) {
  const upper = getTrigramInfoByKey(upperKey);
  const lower = getTrigramInfoByKey(lowerKey);
  const name = HEXAGRAM_MAP[upperKey]?.[lowerKey] || '未知卦';
  const lines: (0 | 1)[] = [...lower.lines, ...upper.lines] as (0 | 1)[];
  return { upper, lower, upperKey, lowerKey, name, lines };
}

function getNowLocalString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// 先天伏羲数起卦算法
function timeToHexagram(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();

  const yearSum = String(year).split('').reduce((s, c) => s + parseInt(c), 0);
  const upperIdx = (yearSum + month + day) % 8;
  const lowerIdx = (yearSum + month + day + hour) % 8;
  const movingLine = (yearSum + month + day + hour) % 6;

  const upperKey = getTrigramKeyByIndex(upperIdx);
  const lowerKey = getTrigramKeyByIndex(lowerIdx);
  return { upperKey, lowerKey, movingLine };
}

// 数字起卦算法
function numberToHexagram(upperNum: number, lowerNum: number) {
  const upperKey = getTrigramKeyByIndex(upperNum % 8);
  const lowerKey = getTrigramKeyByIndex(lowerNum % 8);
  return { upperKey, lowerKey };
}

// ─── 辅助组件 ─────────────────────────────────────

function YaoLine({ type, height = 6, width = '80%', isMoving = false }: { type: 'yin' | 'yang'; height?: number; width?: string; isMoving?: boolean }) {
  const color = isMoving ? '#C2410C' : '#1C1A16';
  if (type === 'yang') {
    return (
      <div className="flex justify-center">
        <div className="rounded-sm" style={{ height: `${height}px`, width, backgroundColor: color }} />
      </div>
    );
  }
  return (
    <div className="flex justify-center" style={{ width }}>
      <div className="mx-auto flex items-center justify-between" style={{ width }}>
        <div className="rounded-sm" style={{ height: `${height}px`, width: '35%', backgroundColor: color }} />
        <div style={{ width: '30%' }} />
        <div className="rounded-sm" style={{ height: `${height}px`, width: '35%', backgroundColor: color }} />
      </div>
    </div>
  );
}

function HexagramFigure({ lines, size = 'normal', movingLineIdx }: { lines: (0 | 1)[]; size?: 'normal' | 'large'; movingLineIdx?: number }) {
  const h = size === 'large' ? 8 : 6;
  const gap = size === 'large' ? 'gap-2' : 'gap-1.5';
  const w = size === 'large' ? '100px' : '72px';

  return (
    <div className={`flex flex-col-reverse ${gap}`} style={{ width: w }}>
      {lines.map((line, i) => (
        <YaoLine key={i} type={line === 1 ? 'yang' : 'yin'} height={h} width="100%" isMoving={movingLineIdx !== undefined && movingLineIdx === i} />
      ))}
    </div>
  );
}

function HexagramPreviewCard({ upperKey, lowerKey, movingLine, label }: { upperKey: string; lowerKey: string; movingLine?: number; label?: string }) {
  const hex = resolveHexagram(upperKey, lowerKey);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4 md:p-6">
      {label && <p className="mb-2 text-xs text-[#1C1A16]/50">{label}</p>}
      <HexagramFigure lines={hex.lines} size="large" movingLineIdx={movingLine} />
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2 text-2xl">
          <span>{hex.upper.symbol}</span>
          <span>{hex.lower.symbol}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-[#1C1A16]">{hex.name}</p>
        <p className="mt-1 text-xs text-[#1C1A16]/55">
          上{hex.upper.name}（{hex.upper.nature}）下{hex.lower.name}（{hex.lower.nature}）
        </p>
        {movingLine !== undefined && (
          <p className="mt-1 text-xs text-orange-700">动爻：第{movingLine + 1}爻</p>
        )}
      </div>
    </div>
  );
}

// ─── 铜钱起卦面板 ─────────────────────────────────

function CoinPanel({ onComplete }: { onComplete: (lines: (0 | 1)[], movingLines: number[]) => void }) {
  const [coinResults, setCoinResults] = useState<CoinLineResult[]>([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentCoins, setCurrentCoins] = useState<boolean[] | null>(null);
  const [flipKey, setFlipKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentYao = coinResults.length;
  const isComplete = coinResults.length === 6;

  const throwCoins = useCallback(() => {
    if (isFlipping || isComplete) return;
    setIsFlipping(true);
    setFlipKey((k) => k + 1);

    // 3枚铜钱: true=背(字面), false=正(背面)
    const coins = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5];
    setCurrentCoins(coins);

    timerRef.current = setTimeout(() => {
      const backs = coins.filter(Boolean).length;
      let value: 6 | 7 | 8 | 9;
      let yinYang: 0 | 1;
      let isMoving = false;

      if (backs === 3) { value = 9; yinYang = 1; isMoving = true; }      // 3背=老阳(动)
      else if (backs === 0) { value = 6; yinYang = 0; isMoving = true; }  // 3正=老阴(动)
      else if (backs === 1) { value = 8; yinYang = 0; isMoving = false; } // 1背2正=少阴
      else { value = 7; yinYang = 1; isMoving = false; }                  // 2背1正=少阳

      const newResult: CoinLineResult = { coins, value, yinYang, isMoving };
      const updated = [...coinResults, newResult];
      setCoinResults(updated);
      setIsFlipping(false);

      if (updated.length === 6) {
        const lines = updated.map((r) => r.yinYang) as (0 | 1)[];
        const moving = updated.reduce<number[]>((acc, r, i) => r.isMoving ? [...acc, i] : acc, []);
        onComplete(lines, moving);
      }
    }, 900);
  }, [isFlipping, isComplete, coinResults, onComplete]);

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCoinResults([]);
    setIsFlipping(false);
    setCurrentCoins(null);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const getCoinResultLabel = (r: CoinLineResult) => {
    const backCount = r.coins.filter(Boolean).length;
    const labels: Record<number, string> = { 9: '三背 → 老阳（动）', 6: '三正 → 老阴（动）', 7: '二背一正 → 少阳', 8: '一背二正 → 少阴' };
    return `${backCount}背${3 - backCount}正 → ${labels[r.value]}`;
  };

  return (
    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">🪙 铜钱起卦</h3>
      <p className="text-xs text-[#1C1A16]/55 mb-4">模拟传统三枚铜钱起卦，从初爻开始依次抛6次</p>

      {/* 进度指示器 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all ${
              i < coinResults.length
                ? 'bg-[#1C1A16]'
                : i === coinResults.length && isFlipping
                  ? 'bg-[#1C1A16]/40 animate-coin-pulse'
                  : 'bg-[#1C1A16]/15'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-[#1C1A16]/60">{coinResults.length}/6 已完成</span>
      </div>

      {/* 铜钱展示区 */}
      <div className="flex justify-center gap-4 my-4">
        {[0, 1, 2].map((idx) => {
          const isBack = currentCoins ? currentCoins[idx] : null;
          const showFlip = isFlipping;
          return (
            <div
              key={`${flipKey}-${idx}`}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-sm font-bold select-none ${showFlip ? 'animate-coin-flip' : ''}`}
              style={{
                perspective: '600px',
                backgroundColor: isBack === null ? '#E5E0D5' : isBack ? '#D4A574' : '#8B6914',
                borderColor: isBack === null ? '#C4BFAF' : isBack ? '#B8894D' : '#6B5210',
                color: isBack === null ? '#999' : '#FFF',
              }}
            >
              {isBack === null ? '？' : isBack ? '通宝' : '☯'}
            </div>
          );
        })}
      </div>

      {/* 当前爻提示 */}
      {!isComplete && (
        <p className="text-center text-xs text-[#1C1A16]/50 mb-3">
          当前：第{currentYao + 1}爻（{['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][currentYao]}）
        </p>
      )}

      {/* 抛币/结果 */}
      {!isComplete ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={throwCoins}
            disabled={isFlipping}
            className="flex h-10 items-center justify-center rounded-lg bg-[#1C1A16] px-6 text-sm font-medium text-white transition-all hover:bg-[#2A2621] disabled:opacity-60"
          >
            {isFlipping ? '铜钱翻转中...' : coinResults.length === 0 ? '开始抛币' : '抛下一爻的铜钱'}
          </button>
          {coinResults.length > 0 && (
            <button type="button" onClick={handleReset} className="text-xs text-[#1C1A16]/50 underline">
              🔄 重新抛币
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-sm font-medium text-green-700 mb-3">✓ 六爻抛币完成！</p>
      )}

      {/* 已完成爻记录 */}
      {coinResults.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {coinResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-[#FAF9F6] px-3 py-2 text-xs">
              <span className="w-10 shrink-0 font-medium text-[#1C1A16]">
                {['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i]}
              </span>
              <span className="flex gap-1">
                {r.coins.map((isBack, ci) => (
                  <span
                    key={ci}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ backgroundColor: isBack ? '#D4A574' : '#8B6914' }}
                  >
                    {isBack ? '通' : '☯'}
                  </span>
                ))}
              </span>
              <span className="text-[#1C1A16]/60">{getCoinResultLabel(r)}</span>
              <span className="ml-auto">
                <YaoLine type={r.yinYang === 1 ? 'yang' : 'yin'} height={4} width="32px" isMoving={r.isMoving} />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 完成后重置 */}
      {isComplete && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={handleReset} className="text-xs text-[#1C1A16]/50 underline">
            🔄 重新抛币
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 时间起卦面板 ─────────────────────────────────

function TimePanel({ onComplete }: { onComplete: (lines: (0 | 1)[], movingLine: number, upperKey: string, lowerKey: string) => void }) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [timeValue, setTimeValue] = useState(getNowLocalString);
  const [isDone, setIsDone] = useState(false);

  const hexData = useMemo(() => timeToHexagram(timeValue), [timeValue]);

  const handleQuickTime = useCallback(() => {
    const now = getNowLocalString();
    setTimeValue(now);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!hexData) return;
    const hex = resolveHexagram(hexData.upperKey, hexData.lowerKey);
    setIsDone(true);
    onComplete(hex.lines, hexData.movingLine, hexData.upperKey, hexData.lowerKey);
  }, [hexData, onComplete]);

  return (
    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">⏰ 时间起卦</h3>
      <p className="text-xs text-[#1C1A16]/55 mb-4">基于年月日时数字按易数规律自动生成卦象</p>

      {/* 模式切换 */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('quick'); setIsDone(false); }}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            mode === 'quick' ? 'bg-[#1C1A16] text-white' : 'border border-[#1C1A16]/10 text-[#1C1A16]/60 hover:border-[#1C1A16]/20'
          }`}
        >
          快速模式
        </button>
        <button
          type="button"
          onClick={() => { setMode('custom'); setIsDone(false); }}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            mode === 'custom' ? 'bg-[#1C1A16] text-white' : 'border border-[#1C1A16]/10 text-[#1C1A16]/60 hover:border-[#1C1A16]/20'
          }`}
        >
          自定义时间
        </button>
      </div>

      {mode === 'quick' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="datetime-local"
              value={timeValue}
              readOnly
              className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1C1A16] outline-none"
            />
            <button
              type="button"
              onClick={handleQuickTime}
              className="shrink-0 rounded-lg border border-[#1C1A16]/15 px-3 py-2 text-xs text-[#1C1A16]/70 transition-colors hover:bg-gray-50"
            >
              刷新当前时间
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="time-divination-datetime" className="block text-xs text-[#1C1A16]/60">选择占卜时间</label>
          <input
            id="time-divination-datetime"
            type="datetime-local"
            value={timeValue}
            max={getNowLocalString()}
            onChange={(e) => { setTimeValue(e.target.value); setIsDone(false); }}
            className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-[#1C1A16] outline-none focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
          />
        </div>
      )}

      {/* 卦象预览 */}
      {hexData && (
        <div className="mt-4">
          <HexagramPreviewCard
            upperKey={hexData.upperKey}
            lowerKey={hexData.lowerKey}
            movingLine={hexData.movingLine}
            label="卦象预览"
          />
        </div>
      )}

      {!isDone && hexData && (
        <button
          type="button"
          onClick={handleConfirm}
          className="mt-4 flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:bg-[#2A2621]"
        >
          ⏰ 确认起卦
        </button>
      )}

      {isDone && (
        <p className="mt-4 text-center text-sm font-medium text-green-700">✓ 时间起卦完成！</p>
      )}
    </div>
  );
}

// ─── 数字起卦面板 ─────────────────────────────────

function NumberPanel({ onComplete }: { onComplete: (lines: (0 | 1)[], movingLine: number | null, upperKey: string, lowerKey: string) => void }) {
  const [upperNum, setUpperNum] = useState('');
  const [lowerNum, setLowerNum] = useState('');
  const [movingPos, setMovingPos] = useState('');
  const [refNum, setRefNum] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [numberErrors, setNumberErrors] = useState<{ upper?: string; lower?: string; moving?: string; ref?: string }>({});

  const validateRange = (value: string, min: number, max: number): string | undefined => {
    if (value === '') return undefined;
    const num = Number(value);
    if (!Number.isInteger(num) || num < min || num > max) {
      return `请输入${min}-${max}的整数`;
    }
    return undefined;
  };

  const handleUpperChange = (value: string) => {
    setUpperNum(value);
    setIsDone(false);
    setNumberErrors((prev) => ({ ...prev, upper: value === '' ? undefined : validateRange(value, 1, 9999) }));
  };

  const handleLowerChange = (value: string) => {
    setLowerNum(value);
    setIsDone(false);
    setNumberErrors((prev) => ({ ...prev, lower: value === '' ? undefined : validateRange(value, 1, 9999) }));
  };

  const handleMovingChange = (value: string) => {
    setMovingPos(value);
    setIsDone(false);
    if (value === '' || value === '0') {
      setNumberErrors((prev) => ({ ...prev, moving: undefined }));
    } else {
      const num = Number(value);
      const err = (!Number.isInteger(num) || num < 1 || num > 6) ? '动爻位置需为1-6' : undefined;
      setNumberErrors((prev) => ({ ...prev, moving: err }));
    }
  };

  const handleRefChange = (value: string) => {
    setRefNum(value);
    setIsDone(false);
    setNumberErrors((prev) => ({ ...prev, ref: value === '' ? undefined : validateRange(value, 1, 9999) }));
  };

  const hasErrors = !!(numberErrors.upper || numberErrors.lower || numberErrors.moving || numberErrors.ref);
  const isRequiredFilled = upperNum !== '' && lowerNum !== '' && !numberErrors.upper && !numberErrors.lower;
  const canConfirm = isRequiredFilled && !hasErrors;

  const hexData = useMemo(() => {
    const up = parseInt(upperNum);
    const lo = parseInt(lowerNum);
    if (isNaN(up) || isNaN(lo) || up < 1 || lo < 1) return null;
    if (numberErrors.upper || numberErrors.lower) return null;
    const result = numberToHexagram(up, lo);
    const movingVal = parseInt(movingPos);
    const moving = (!isNaN(movingVal) && movingVal >= 1 && movingVal <= 6) ? movingVal - 1 : null;
    return { ...result, movingLine: moving };
  }, [upperNum, lowerNum, movingPos, numberErrors.upper, numberErrors.lower]);

  const handleRandomize = () => {
    setUpperNum(String(Math.floor(Math.random() * 9999) + 1));
    setLowerNum(String(Math.floor(Math.random() * 9999) + 1));
    setMovingPos(Math.random() > 0.5 ? String(Math.floor(Math.random() * 6) + 1) : '0');
    setRefNum(String(Math.floor(Math.random() * 9999) + 1));
    setNumberErrors({});
    setIsDone(false);
  };

  const handleConfirm = () => {
    if (!hexData || !canConfirm) return;
    const hex = resolveHexagram(hexData.upperKey, hexData.lowerKey);
    setIsDone(true);
    onComplete(hex.lines, hexData.movingLine, hexData.upperKey, hexData.lowerKey);
  };

  const inputBorderClass = (error?: string) =>
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-[#1C1A16]/30 focus:ring-[#1C1A16]/10';

  return (
    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">🔢 数字起卦</h3>
      <p className="text-xs text-[#1C1A16]/55 mb-4">输入数字来生成卦象，适合有特定数字灵感时使用</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="number-upper" className="mb-1 block text-xs text-[#1C1A16]/60">上卦数字 *</label>
          <input
            id="number-upper"
            type="number"
            min={1}
            max={9999}
            value={upperNum}
            onChange={(e) => handleUpperChange(e.target.value)}
            placeholder="1-9999"
            className={`h-12 w-full rounded-lg border px-3 text-center text-lg font-medium text-[#1C1A16] outline-none focus:ring-2 ${inputBorderClass(numberErrors.upper)}`}
          />
          {numberErrors.upper && <p className="text-xs text-red-500 mt-1">{numberErrors.upper}</p>}
        </div>
        <div>
          <label htmlFor="number-lower" className="mb-1 block text-xs text-[#1C1A16]/60">下卦数字 *</label>
          <input
            id="number-lower"
            type="number"
            min={1}
            max={9999}
            value={lowerNum}
            onChange={(e) => handleLowerChange(e.target.value)}
            placeholder="1-9999"
            className={`h-12 w-full rounded-lg border px-3 text-center text-lg font-medium text-[#1C1A16] outline-none focus:ring-2 ${inputBorderClass(numberErrors.lower)}`}
          />
          {numberErrors.lower && <p className="text-xs text-red-500 mt-1">{numberErrors.lower}</p>}
        </div>
        <div>
          <label htmlFor="number-moving" className="mb-1 block text-xs text-[#1C1A16]/60">动爻位置</label>
          <input
            id="number-moving"
            type="number"
            min={0}
            max={6}
            value={movingPos}
            onChange={(e) => handleMovingChange(e.target.value)}
            placeholder="1-6 或 0"
            className={`h-12 w-full rounded-lg border px-3 text-center text-lg font-medium text-[#1C1A16] outline-none focus:ring-2 ${inputBorderClass(numberErrors.moving)}`}
          />
          {numberErrors.moving ? (
            <p className="text-xs text-red-500 mt-1">{numberErrors.moving}</p>
          ) : (
            <p className="mt-0.5 text-[10px] text-[#1C1A16]/40">0=无动爻</p>
          )}
        </div>
        <div>
          <label htmlFor="number-ref" className="mb-1 block text-xs text-[#1C1A16]/60">参考数字</label>
          <input
            id="number-ref"
            type="number"
            min={1}
            max={9999}
            value={refNum}
            onChange={(e) => handleRefChange(e.target.value)}
            placeholder="1-9999"
            className={`h-12 w-full rounded-lg border px-3 text-center text-lg font-medium text-[#1C1A16] outline-none focus:ring-2 ${inputBorderClass(numberErrors.ref)}`}
          />
          {numberErrors.ref ? (
            <p className="text-xs text-red-500 mt-1">{numberErrors.ref}</p>
          ) : (
            <p className="mt-0.5 text-[10px] text-[#1C1A16]/40">可选</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleRandomize}
        className="mb-4 flex h-10 w-full items-center justify-center rounded-lg border border-[#1C1A16]/15 text-sm text-[#1C1A16]/70 transition-colors hover:bg-gray-50"
      >
        🎲 随机生成
      </button>

      {hexData && (
        <div className="mb-4">
          <HexagramPreviewCard
            upperKey={hexData.upperKey}
            lowerKey={hexData.lowerKey}
            movingLine={hexData.movingLine ?? undefined}
            label="卦象预览"
          />
        </div>
      )}

      {!isDone && canConfirm && hexData && (
        <button
          type="button"
          onClick={handleConfirm}
          className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:bg-[#2A2621]"
        >
          🔮 确认起卦
        </button>
      )}

      {!isDone && !canConfirm && (
        <div>
          <button
            type="button"
            disabled
            className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white opacity-60 cursor-not-allowed"
          >
            🔮 确认起卦
          </button>
          <p className="mt-2 text-center text-xs text-[#1C1A16]/45">请完成起卦参数</p>
        </div>
      )}

      {isDone && (
        <p className="mt-2 text-center text-sm font-medium text-green-700">✓ 数字起卦完成！</p>
      )}
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────

export default function LiuYaoPage() {
  const [question, setQuestion] = useState('');
  const [method, setMethod] = useState<DivinationMethod>('manual');
  const [lineSelections, setLineSelections] = useState<LineValue[]>([null, null, null, null, null, null]);
  const [divinationTime, setDivinationTime] = useState(getNowLocalString);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // 新增：非手动模式的卦象数据
  const [resolvedUpperKey, setResolvedUpperKey] = useState<string | null>(null);
  const [resolvedLowerKey, setResolvedLowerKey] = useState<string | null>(null);
  const [resolvedMovingLine, setResolvedMovingLine] = useState<number | null>(null);
  const [resolvedMovingLines, setResolvedMovingLines] = useState<number[]>([]); // 铜钱多动爻
  const [hexagramReady, setHexagramReady] = useState(false);

  const allLinesSelected = method === 'manual'
    ? lineSelections.every((v) => v !== null)
    : hexagramReady;

  const previewLines = useMemo(() => lineSelections as (0 | 1 | null)[], [lineSelections]);

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
    const actualIndex = 5 - displayIndex;
    setLineSelections((prev) => {
      const next = [...prev];
      next[actualIndex] = value;
      return next;
    });
  }, []);

  // 铜钱模式完成回调
  const handleCoinComplete = useCallback((lines: (0 | 1)[], movingLines: number[]) => {
    setLineSelections(lines);
    setResolvedMovingLines(movingLines);
    setHexagramReady(true);

    const lowerLines = lines.slice(0, 3) as [number, number, number];
    const upperLines = lines.slice(3, 6) as [number, number, number];
    const lk = Object.entries(TRIGRAMS_MAP).find(([, t]) => t.lines[0] === lowerLines[0] && t.lines[1] === lowerLines[1] && t.lines[2] === lowerLines[2])?.[0] || 'qian';
    const uk = Object.entries(TRIGRAMS_MAP).find(([, t]) => t.lines[0] === upperLines[0] && t.lines[1] === upperLines[1] && t.lines[2] === upperLines[2])?.[0] || 'qian';
    setResolvedLowerKey(lk);
    setResolvedUpperKey(uk);
    setResolvedMovingLine(movingLines.length > 0 ? movingLines[0] : null);
  }, []);

  // 时间模式完成回调
  const handleTimeComplete = useCallback((lines: (0 | 1)[], movingLine: number, upperKey: string, lowerKey: string) => {
    setLineSelections(lines);
    setResolvedUpperKey(upperKey);
    setResolvedLowerKey(lowerKey);
    setResolvedMovingLine(movingLine);
    setResolvedMovingLines([movingLine]);
    setHexagramReady(true);
  }, []);

  // 数字模式完成回调
  const handleNumberComplete = useCallback((lines: (0 | 1)[], movingLine: number | null, upperKey: string, lowerKey: string) => {
    setLineSelections(lines);
    setResolvedUpperKey(upperKey);
    setResolvedLowerKey(lowerKey);
    setResolvedMovingLine(movingLine);
    setResolvedMovingLines(movingLine !== null ? [movingLine] : []);
    setHexagramReady(true);
  }, []);

  const handleSubmit = async () => {
    if (!allLinesSelected) {
      setError('请先完成起卦');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const lines = lineSelections as number[];

    let upperKey: string, lowerKey: string;
    if (method === 'manual') {
      upperKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === upperTrigram)?.[0] || '';
      lowerKey = Object.entries(TRIGRAMS_MAP).find(([, v]) => v === lowerTrigram)?.[0] || '';
    } else {
      upperKey = resolvedUpperKey || '';
      lowerKey = resolvedLowerKey || '';
    }

    try {
      const res = await fetch('/api/liuyao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          hexagrams: {
            upper: upperKey,
            lower: lowerKey,
            lines,
            movingLines: resolvedMovingLines,
          },
          method,
          divinationTime: new Date(divinationTime).toISOString(),
        }),
      });

      if (!res.ok || !res.body) {
        let errMsg = '请求失败，请稍后重试。';
        try {
          const data = await res.json();
          if (data?.error) errMsg = data.error;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaSet = false;
      let acc = '';
      let current: LiuYaoResult | null = null;

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
              const initial: LiuYaoResult = {
                hexagramName: json.meta.hexagramName,
                upperTrigram: json.meta.upperTrigram,
                lowerTrigram: json.meta.lowerTrigram,
                upperSymbol: json.meta.upperSymbol,
                lowerSymbol: json.meta.lowerSymbol,
                lines: json.meta.lines,
                judgment: json.meta.judgment,
                actionAdvice: json.meta.actionAdvice,
                overallNarrative: '',
              };
              current = initial;
              setResult(initial);
            } else if (json.content && current) {
              acc += json.content;
              const currentValue: LiuYaoResult = current;
              current = { ...currentValue, overallNarrative: acc };
              setResult((prev) => (prev ? { ...prev, overallNarrative: acc } : prev));
            }
          } catch {}
        }
      }

      setStreaming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLineSelections([null, null, null, null, null, null]);
    setQuestion('');
    setError('');
    setResolvedUpperKey(null);
    setResolvedLowerKey(null);
    setResolvedMovingLine(null);
    setResolvedMovingLines([]);
    setHexagramReady(false);
    setDivinationTime(getNowLocalString());
  };

  const handleMethodChange = (newMethod: DivinationMethod) => {
    setMethod(newMethod);
    setLineSelections([null, null, null, null, null, null]);
    setResolvedUpperKey(null);
    setResolvedLowerKey(null);
    setResolvedMovingLine(null);
    setResolvedMovingLines([]);
    setHexagramReady(false);
    setError('');
    setResult(null);
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
            AI 六爻占卜 · 智能解读分析
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-[#1C1A16]/55 md:text-base">
            融合传统六爻占卜与人工智能技术，为你提供更深度的卦象分析和趋势预测。
          </p>
        </section>

        <section className="mx-auto max-w-4xl space-y-4 animate-fadeIn">
          {/* ② 问题输入区 */}
          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
            <label htmlFor="liuyao-question" className="mb-2 block text-sm text-[#1C1A16]/75">你的问题</label>
            <div className="relative">
              <textarea
                id="liuyao-question"
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
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMethodChange(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all duration-200 ${
                      isActive
                        ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)] text-[#1C1A16] shadow-sm'
                        : 'border border-[#1C1A16]/10 bg-white text-[#1C1A16] hover:border-[#1C1A16]/20 hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ④ 起卦参数区（动态面板） */}

          {/* ④-a 手动起卦面板 */}
          {method === 'manual' && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              <h3 className="text-base font-semibold text-[#1C1A16] mb-1">手动起卦</h3>
              <p className="text-xs text-[#1C1A16]/55 mb-4">请从上到下依次选择六爻的阴阳</p>

              <div className="flex flex-col gap-4 md:flex-row md:gap-8">
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

                <div className="flex flex-col items-center justify-center rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-6 md:w-[220px]">
                  <p className="mb-3 text-xs text-[#1C1A16]/50">卦象预览</p>
                  {lineSelections.every((v) => v !== null) ? (
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

          {/* ④-b 铜钱起卦面板 */}
          {method === 'coin' && !result && (
            <CoinPanel onComplete={handleCoinComplete} />
          )}

          {/* ④-c 时间起卦面板 */}
          {method === 'time' && !result && (
            <TimePanel onComplete={handleTimeComplete} />
          )}

          {/* ④-d 数字起卦面板 */}
          {method === 'number' && !result && (
            <NumberPanel onComplete={handleNumberComplete} />
          )}

          {/* ⑤ 占卜时间 + ⑥ 解卦按钮 */}
          {!result && (
            <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-4 transition-shadow duration-300 hover:shadow-card-hover md:p-6">
              {method !== 'time' && (
                <div className="mb-4">
                  <label htmlFor="liuyao-divination-time" className="mb-1 block text-sm text-[#1C1A16]/75">占卜时间</label>
                  <input
                    id="liuyao-divination-time"
                    type="datetime-local"
                    value={divinationTime}
                    onChange={(e) => setDivinationTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-300 px-3 text-sm text-[#1C1A16] outline-none focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 md:w-auto"
                  />
                  <p className="mt-1 text-xs text-[#1C1A16]/45">占卜时间会影响卦象的时效性参考</p>
                </div>
              )}

              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || streaming || !allLinesSelected}
                className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#1C1A16] text-sm font-medium text-white transition-all hover:bg-[#2A2621] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || streaming ? (
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
              {!allLinesSelected && method !== 'manual' && (
                <p className="mt-2 text-center text-xs text-[#1C1A16]/45">请先完成起卦</p>
              )}
              {loading && !result && (
                <div className="mt-4 flex justify-center">
                  <OracleLoading />
                </div>
              )}
            </div>
          )}

          {/* ⑦ 解卦结果区 */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
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
                        {resolvedMovingLines.includes(line.index) && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">动爻</span>
                        )}
                      </div>
                      <div className="mb-2">
                        <YaoLine
                          type={line.type}
                          height={8}
                          width="120px"
                          isMoving={resolvedMovingLines.includes(line.index)}
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
                          <li key={i} className="text-sm leading-relaxed text-green-700">· {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.actionAdvice.cautions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-amber-700 mb-1">⚠ 注意事项</h4>
                      <ul className="space-y-1 pl-1">
                        {result.actionAdvice.cautions.map((item, i) => (
                          <li key={i} className="text-sm leading-relaxed text-amber-700">· {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.actionAdvice.actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1">💡 下一步行动</h4>
                      <div className="space-y-1">
                        {result.actionAdvice.actions.map((item, i) => (
                          <p key={i} className="text-sm leading-relaxed text-blue-700">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6 transition-shadow duration-300 hover:shadow-card-hover">
                <h3 className="text-base font-semibold text-[#1C1A16] mb-1">综合分析</h3>
                <p className="text-xs text-[#1C1A16]/45 mb-3">AI 综合分析 · 仅供参考</p>
                {streaming && !result.overallNarrative ? (
                  <OracleLoading />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1C1A16]/75">
                    {result.overallNarrative}
                    {streaming && result.overallNarrative && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                    )}
                  </p>
                )}
              </div>

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
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl tracking-[0.06em] text-[#1C1A16] mb-4">AI 六爻占卜分析</h2>
            <p className="text-sm leading-relaxed text-[#1C1A16]/55 max-w-2xl mx-auto">
              六爻占卜是中国传统易学的核心预测方法，源于古代蓍草占卜，后由汉代京房发展为铜钱起卦法，历经千年传承。我们融合现代 AI 技术对传统六爻卦象进行深度解析，结合纳甲体系、六神理论，为您提供更加精准、客观的占卜结果，助您在人生重要抉择中获得智慧指引。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                  </svg>
                ),
                title: '精准预测',
                desc: '运用传统六爻占卜理论，结合世应、六亲、六神等要素，为您的重要决策提供准确的预测和指导',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                ),
                title: 'AI 智能分析',
                desc: '融合现代人工智能技术与古典六爻理论，深度解析卦象变化，提供客观精准的占卜结果',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ),
                title: '时运分析',
                desc: '基于六爻卦象的动静变化，分析事态发展趋势和最佳行动时机，助您把握人生机遇',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F5] text-[#666] mb-5">{item.icon}</div>
                <h3 className="text-base font-bold text-[#1C1A16] mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#1C1A16]/55">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ⑨ 特色功能 */}
        <section className="mx-auto mt-10 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.06em] text-[#1C1A16] text-center mb-10">AI 六爻占卜的特色功能</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#1C1A16]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h2m2 0h4M8 8h8M8 16h5" />
                  </svg>
                ),
                title: '多维度卦象分析',
                desc: '结合世应关系、六亲配置、六神状态等多个维度，运用 AI 技术对六爻卦象进行全面深度解析',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#1C1A16]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: '个性化占卜解读',
                desc: '根据您的具体问题类型和卦象特征，提供针对性的六爻预测分析，确保每一次占卜都有独特价值',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#1C1A16]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: '现代化易学表达',
                desc: '将传统六爻理论转化为现代通俗语言，让复杂的纳甲体系和六神理论变得易懂实用',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#1C1A16]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
                title: '智能趋势预测',
                desc: '运用 AI 智能算法分析卦象变化趋势，结合历史案例和实战经验，预测事态发展方向',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-5">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1A16] mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#1C1A16]/55">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⑩ FAQ */}
        <section className="mx-auto mt-10 max-w-4xl animate-fadeIn">
          <h2 className="font-display text-2xl tracking-[0.06em] text-[#1C1A16] text-center mb-8">常见问题</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const expanded = expandedFaq === index;
              return (
                <div key={item.q} className="rounded-2xl border border-[#E5E0D8] bg-white p-6">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => setExpandedFaq((prev) => (prev === index ? null : index))}
                  >
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#1C1A16]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v0m0 4v4" />
                    </svg>
                    <span className="text-[15px] font-bold text-[#1C1A16] flex-1">{item.q}</span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expanded ? 'mt-4 max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="pl-8 text-sm leading-relaxed text-[#1C1A16]/60">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <AiDisclaimer />
          <div className="mt-4 rounded-2xl border border-[#1C1A16]/10 bg-white p-3 text-center text-xs text-[#1C1A16]/45">
            ⚠️ 免责声明：本站六爻占卜内容仅供娱乐与自我探索参考，不构成医疗、法律或投资建议。请结合现实信息理性判断。
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { AlertTriangle, BellRing, ChevronDown, Share2, RefreshCw, ScrollText, TrendingUp, Sparkles, Link2, ClipboardList, LineChart, Lock, MessageCircleQuestion, Users } from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/ui/PageShell';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Button } from '@/components/ui/Button';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LifeKlineChart } from '@/components/life-kline/LifeKlineChart';
import { BacktestCard, type BacktestKind, type BacktestVote } from '@/components/life-kline/BacktestCard';
import { LifeKlineShareDialog } from '@/components/life-kline/LifeKlineShareCard';
import { MonthDrill } from '@/components/life-kline/MonthDrill';
import { loadBirthInfo, saveBirthInfo } from '@/lib/utils/storage';
import { track } from '@/lib/analytics';
import {
  buildNarrative,
  selectBacktestYears,
  type DimKey,
  type LifeKlineResult,
  type LifeKlineLevel,
  type LifeKlineYearPoint,
  type LiuyueKlineResult,
} from '@/lib/bazi/lifeKline';
import { adviceForYear } from '@/lib/bazi/adviceTemplates';

const _loadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
  </div>
);

const BaziChatSection = dynamic(
  () => import('@/components/bazi/BaziChatSection').then((m) => m.BaziChatSection),
  { ssr: false, loading: _loadingSpinner },
);

const cardClass = 'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white';

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

/** 时辰选项：value 为时辰序号（-1 = 不知道），提交时映射为代表小时 */
const SHICHEN_OPTIONS = [
  { value: '-1', label: '不知道' },
  { value: '0', label: '子时 (23:00-00:59)' },
  { value: '1', label: '丑时 (01:00-02:59)' },
  { value: '2', label: '寅时 (03:00-04:59)' },
  { value: '3', label: '卯时 (05:00-06:59)' },
  { value: '4', label: '辰时 (07:00-08:59)' },
  { value: '5', label: '巳时 (09:00-10:59)' },
  { value: '6', label: '午时 (11:00-12:59)' },
  { value: '7', label: '未时 (13:00-14:59)' },
  { value: '8', label: '申时 (15:00-16:59)' },
  { value: '9', label: '酉时 (17:00-18:59)' },
  { value: '10', label: '戌时 (19:00-20:59)' },
  { value: '11', label: '亥时 (21:00-22:59)' },
];

/** 时辰序号 → 代表小时（取时辰中段） */
function shichenToHour(idx: number): number | undefined {
  if (idx < 0 || idx > 11) return undefined;
  return idx === 0 ? 0 : idx * 2;
}

const LEVEL_STYLE: Record<LifeKlineLevel, string> = {
  极盛: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  上佳: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  平稳: 'bg-[#F6F4F1] text-[#1C1A16]/70 border-[#1C1A16]/10',
  承压: 'bg-amber-50 text-amber-700 border-amber-200',
  低谷: 'bg-red-50 text-red-600 border-red-200',
};

function DeltaText({ value, suffix }: { value: number; suffix?: string }) {
  const cls = value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-500' : 'text-[#1C1A16]/60';
  return (
    <span className={`font-medium ${cls}`}>
      {value > 0 ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

const KLINE_PRESET_QUESTIONS = [
  '我目前处于什么大运？运势如何？',
  '今年的流年对我有什么影响？',
  '未来几年我的运势走向如何？',
  '我的命格有什么特点？',
];

const FEATURES = [
  {
    icon: LineChart,
    title: 'K线可视化',
    desc: '借鉴股票K线图的 OHLC 模型，将每一年的运势起伏用开盘、收盘、最高、最低四个维度直观呈现，一眼看清人生节奏。',
  },
  {
    icon: Sparkles,
    title: 'AI 命理分析',
    desc: '基于传统八字命理体系，综合分析日主强弱、十神喜忌、大运流年等因素，可通过 AI 问答深入解读每段运势。',
  },
  {
    icon: Link2,
    title: '大运流年联动',
    desc: '精准标注每步大运的起止年份和十神关系，每年流年干支一目了然，换运年波动清晰可见。',
  },
];

const STEPS = [
  { icon: ClipboardList, title: '输入八字信息', desc: '输入出生日期和时辰，系统自动计算四柱干支、大运和流年信息。' },
  { icon: TrendingUp, title: '生成运势K线', desc: '根据您的命盘信息，综合大运、流年、十神喜忌等因素，生成 1 岁到 100 岁的运势K线图。' },
  { icon: MessageCircleQuestion, title: '解读与问答', desc: '查看当前运势坐标，了解大运进度，还可以通过 AI 问答深入了解每一段运势的含义。' },
];

const FAQ_ITEMS = [
  {
    q: '什么是人生K线？',
    a: '人生K线是将传统八字命理与金融K线图结合的运势可视化工具。它以出生八字为基础，逐年推算大运与流年对命局的作用，把每一年的运势起伏画成一根K线，让您像看股票走势一样直观地了解一生的运势节奏。',
  },
  {
    q: '如何看懂K线图？',
    a: '每根K线代表一年：绿色（阳线）表示当年运势较上年上升，红色（阴线）表示下降；K线上下的细线（影线）表示当年运势的最高点和最低点，波动越大说明当年起伏越明显。橙色曲线是十年均线（MA10），反映十年维度的大趋势。',
  },
  {
    q: '人生K线准确吗？',
    a: '人生K线基于传统八字命理的确定性算法生成，同一出生信息得到的K线永远一致。但命理分析属于传统文化范畴，结果仅供参考与娱乐，不构成任何人生决策依据。人生走向更多取决于个人的努力与选择。',
  },
  {
    q: '换大运时会有什么变化？',
    a: '八字命理中每十年为一步大运，换大运意味着影响命局的主要力量发生更替，运势基调可能明显转变。K线图上换运之年的振幅会加大，前后十年的整体高度也常有台阶式的变化，图中可对照大运表查看每步大运的起止年份。',
  },
  {
    q: '运势可以改变吗？',
    a: '命理只描述先天的势能分布，如同天气预报之于出行。低谷年提醒您稳健蓄力，高峰年鼓励您积极进取。真正决定人生高度的是认知、努力与选择，运势只是参考的风向，而您才是掌舵的人。',
  },
];

export default function LifeKlinePage() {
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthHour, setBirthHour] = useState('4');
  const [gender, setGender] = useState('male');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [result, setResult] = useState<LifeKlineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  // 有结果后表单默认收起，点「重算」再展开
  const [showForm, setShowForm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // 当前结果对应的输入（表单可能被编辑而未提交，回测/分享须锚定已计算的命盘）
  const [computedFor, setComputedFor] = useState<{ d: string; h: string; g: string } | null>(null);
  // VIP 分维度/流月解锁状态（以服务端返回为准）
  const [vipUnlocked, setVipUnlocked] = useState(false);
  const [paywall, setPaywall] = useState<'dims' | 'months' | null>(null);
  const [monthDrill, setMonthDrill] = useState<{ loading: boolean; data: LiuyueKlineResult | null }>({ loading: false, data: null });
  const [chatInject, setChatInject] = useState<{ text: string; nonce: number } | undefined>(undefined);
  const [remindState, setRemindState] = useState<'idle' | 'saving' | 'done' | 'need-login'>('idle');
  const [newYearBanner, setNewYearBanner] = useState<string | null>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const { status } = useSession();
  const [isMember, setIsMember] = useState(false);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsMember(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/quota');
        if (!res.ok) return;
        const data = (await res.json()) as { isMember?: boolean };
        if (!cancelled) setIsMember(Boolean(data?.isMember));
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  const compute = async (d: string, h: string, g: string) => {
    setLoading(true);
    setError(null);
    track('tool_ai_trigger', { tool: 'life_kline' });
    const startTime = Date.now();
    try {
      const hourNum = shichenToHour(Number(h));
      const res = await fetch('/api/life-kline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: g,
          birthDate: d,
          knowTime: hourNum !== undefined,
          birthHourNum: hourNum,
          birthMinute: hourNum !== undefined ? 0 : undefined,
          withDims: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || `请求失败 (${res.status})`);
      const data = body.data as LifeKlineResult;
      setResult(data);
      setVipUnlocked(Boolean(body.vipDims));
      setComputedFor({ d, h, g });
      setShowForm(false);
      setMonthDrill({ loading: false, data: null });
      setRemindState('idle');
      // 跨流年横幅（P2-B）：上次访问的流年与本次不同则提示报告已更新
      try {
        const seenKey = 'kline_seen_flow_year';
        const seen = localStorage.getItem(seenKey);
        const nowYear = String(data.summary.currentYear);
        if (seen && seen !== nowYear && data.summary.currentAge !== null) {
          const cur = data.points[data.summary.currentAge - 1];
          setNewYearBanner(cur ? `你的 ${cur.ganzhi} 流年K线已更新，看看新一年的走势与宜忌。` : null);
        }
        localStorage.setItem(seenKey, nowYear);
      } catch { /* ignore */ }
      saveBirthInfo({ birthDate: d, birthHour: h, gender: g });
      track('tool_ai_complete', { tool: 'life_kline', duration_ms: Date.now() - startTime });
    } catch (err) {
      track('tool_ai_error', { tool: 'life_kline', error_type: 'api_error' });
      setError(err instanceof Error ? err.message : '计算失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 首次进入：有保存的出生信息则直接生成，否则用示例数据展示效果
  useEffect(() => {
    const saved = loadBirthInfo();
    const d = saved?.birthDate || birthDate;
    const h = saved?.birthHour ?? birthHour;
    const g = saved?.gender === 'female' ? 'female' : 'male';
    if (saved) {
      setBirthDate(d);
      setBirthHour(h);
      setGender(g);
    }
    compute(d, h, g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!birthDate) newErrors.birthDate = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    compute(birthDate, birthHour, gender);
  };

  const handleExport = async () => {
    if (!chartCardRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(chartCardRef.current, { backgroundColor: '#FFFFFF', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `人生K线_${birthDate}.png`;
      a.click();
      track('share_export', { tool: 'life_kline' });
    } catch {
      setError('导出图片失败，请稍后再试');
    } finally {
      setExporting(false);
    }
  };

  // 回测卡（P0-A）：从已经历区间选高光/承压各一年
  const backtest = useMemo(() => (result ? selectBacktestYears(result) : null), [result]);
  const backtestBirthKey = computedFor ? `${computedFor.d}|${computedFor.h}|${computedFor.g}` : '';

  const handleBacktestVote = (kind: BacktestKind, point: LifeKlineYearPoint, vote: BacktestVote) => {
    track('kline_backtest_vote', {
      vote,
      kind,
      level: point.level,
      year_offset: (result?.summary.currentYear ?? point.year) - point.year,
    });
    // 仅登录用户落库（护栏指标数据源）；游客只打埋点
    if (status === 'authenticated' && computedFor) {
      fetch('/api/life-kline/backtest-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: computedFor.d,
          gender: computedFor.g,
          birthHourNum: shichenToHour(Number(computedFor.h)),
          year: point.year,
          age: point.age,
          score: point.close,
          level: point.level,
          kind,
          vote,
        }),
      }).catch(() => {});
    }
  };

  const scrollToChart = () => {
    chartCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── P1-A/P1-B：付费墙 ──
  const handlePaywall = (feature: 'dims' | 'months') => {
    track(feature === 'dims' ? 'kline_dim_paywall_show' : 'kline_month_paywall_show', {});
    setPaywall(feature);
  };

  // ── P1-B：流月下钻 ──
  const handleYearClick = async (point: LifeKlineYearPoint) => {
    if (!computedFor) return;
    track('kline_month_drill', { year: point.year, is_vip: vipUnlocked });
    setMonthDrill({ loading: true, data: null });
    try {
      const hourNum = shichenToHour(Number(computedFor.h));
      const res = await fetch('/api/life-kline/months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: computedFor.g,
          birthDate: computedFor.d,
          knowTime: hourNum !== undefined,
          birthHourNum: hourNum,
          birthMinute: hourNum !== undefined ? 0 : undefined,
          year: point.year,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || '加载失败');
      setMonthDrill({ loading: false, data: body.data as LiuyueKlineResult });
    } catch {
      setMonthDrill({ loading: false, data: null });
    }
  };

  // ── P1-C：场景化 AI 入口 ──
  const injectChatQuestion = (text: string, from: string) => {
    track('kline_advice_to_chat', { from });
    setChatInject({ text, nonce: Date.now() });
    setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleAskAiYear = (point: LifeKlineYearPoint) => {
    if (!result) return;
    const advice = adviceForYear({
      level: point.level,
      yongShen: result.meta.mingGe.yongShen,
      jiShen: result.meta.mingGe.jiShen,
      tenGod: point.ganTenGod,
    });
    injectChatQuestion(
      `我 ${point.year} 年（${point.ganzhi} 年，${point.level}）宜${advice.yi.join('、')}，忌${advice.ji.join('、')}——这一年具体该怎么安排？`,
      point.level,
    );
  };

  // ── P2-B：换大运提醒意向 ──
  const handleRemind = async (targetYear: number, dayunGanZhi: string) => {
    if (status !== 'authenticated') {
      setRemindState('need-login');
      return;
    }
    if (!computedFor || remindState === 'saving' || remindState === 'done') return;
    setRemindState('saving');
    track('kline_remind_subscribe', { target_year: targetYear });
    try {
      const res = await fetch('/api/life-kline/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: computedFor.d,
          gender: computedFor.g,
          birthHourNum: shichenToHour(Number(computedFor.h)),
          targetYear,
          dayunGanZhi,
        }),
      });
      const body = await res.json().catch(() => ({}));
      setRemindState(res.ok && body.success ? 'done' : 'idle');
    } catch {
      setRemindState('idle');
    }
  };

  const currentDayun = result?.dayuns.find((d) => d.isCurrent) ?? null;
  const nextDayun =
    result && currentDayun ? result.dayuns.find((d) => d.index === currentDayun.index + 1) ?? null : null;

  // 换运倒计时：以下一步大运起始年的生日为近似换运锚点（起运有月数零头，标注「约」）
  const dayunCountdownDays = (() => {
    if (!nextDayun || !computedFor) return null;
    const [, m, day] = computedFor.d.split('-').map(Number);
    const target = new Date(nextDayun.yearStart, (m || 1) - 1, day || 1);
    const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
    return days > 0 ? days : null;
  })();

  const narrative = useMemo(() => (result ? buildNarrative(result) : []), [result]);
  const currentPoint =
    result && result.summary.currentAge !== null
      ? result.points[result.summary.currentAge - 1] ?? null
      : null;
  const prevPoint =
    result && result.summary.currentAge !== null && result.summary.currentAge >= 2
      ? result.points[result.summary.currentAge - 2] ?? null
      : null;

  // 传给 AI 问答的K线摘要（作为已有分析上下文）
  const klineSummary = result
    ? [
        `人生K线分析（基于八字 ${result.meta.fourPillars}，${result.meta.dayMaster}命，${result.meta.mingGe.geju}，日主${result.meta.mingGe.rizhuStrength}，喜用神${result.meta.mingGe.yongShen}，忌神${result.meta.mingGe.jiShen}）：`,
        currentDayun
          ? `当前大运 ${currentDayun.ganZhi}（${currentDayun.tenGod}，${currentDayun.ageStart}-${currentDayun.ageEnd}岁，${currentDayun.fortune}）。`
          : '',
        currentPoint
          ? `当前 ${currentPoint.year} 年（${currentPoint.age}岁，流年${currentPoint.ganzhi}）运势分 ${currentPoint.close}，等级${currentPoint.level}，${currentPoint.comment}。`
          : '',
        `整体：最佳十年 ${result.summary.bestDecade.ageStart}-${result.summary.bestDecade.ageEnd}岁（均分${result.summary.bestDecade.avg}），最具挑战十年 ${result.summary.worstDecade.ageStart}-${result.summary.worstDecade.ageEnd}岁（均分${result.summary.worstDecade.avg}），运势巅峰 ${result.summary.peak.year}年（${result.summary.peak.age}岁，${result.summary.peak.score}分），低谷 ${result.summary.trough.year}年（${result.summary.trough.age}岁，${result.summary.trough.score}分），当前处于${result.summary.currentPhase}。`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="min-h-dvh bg-[#FAF9F6]">
      {/* 标题区 */}
      <PageShell width="wide" className="pt-16 md:pt-24 pb-6 md:pb-8">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em]"
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
            百年运势可视化
          </span>
          <h1 className="mt-4 font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight">
            人生K线
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">
            基于八字命理的百年运势可视化 · 用金融K线的视角，直观呈现大运流年的起伏节奏
          </p>
        </div>
      </PageShell>

      {/* 输入区：无结果时常显；有结果后收起，点「重算」展开 */}
      {(!result || showForm) && (
      <PageShell width="wide" className="pb-6 md:pb-8">
        <div ref={formRef} className="rounded-2xl border border-[#1C1A16]/8 bg-white p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 relative">
              <DatePicker
                value={birthDate}
                onChange={(v) => { setBirthDate(v); setErrors({}); }}
                label="出生日期"
                triggerClassName={
                  errors.birthDate
                    ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200'
                    : 'border-[#E8E4DD] focus:border-brand-accent'
                }
              />
              {errors.birthDate && (
                <span className="absolute -bottom-5 left-0 text-[11px] text-red-500">请选择出生日期</span>
              )}
            </div>
            <div className="flex-1">
              <Select
                label="出生时辰"
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                options={SHICHEN_OPTIONS}
                placeholder="请选择时辰"
                className="border-[#E8E4DD] focus:border-brand-accent"
              />
            </div>
            <div className="flex-1" role="group" aria-labelledby="kline-gender-label">
              <label id="kline-gender-label" className="block text-sm font-medium text-[#1C1A16] mb-2">性别</label>
              <SegmentControl options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>
            <div className="md:shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                className="w-full md:w-auto whitespace-nowrap"
              >
                生成K线
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#1C1A16]/40">性别影响大运顺逆排法；不知道时辰也可生成，精度略降。</p>
        </div>
      </PageShell>
      )}

      {/* 错误提示 */}
      {error && (
        <PageShell width="wide" className="pb-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-600 flex-1">{error}</span>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重试
            </button>
          </div>
        </PageShell>
      )}

      {loading && !result && (
        <PageShell width="wide" className="pb-10 md:pb-16">
          <div className="flex flex-col items-center justify-center py-20">
            <BaguaSpinner />
            <p className="mt-4 text-sm text-[#1C1A16]/50">正在推演百年运势...</p>
          </div>
        </PageShell>
      )}

      {result && (
        <PageShell width="wide" className="pb-6 md:pb-8">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* 新流年横幅（P2-B） */}
            {newYearBanner && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#059669' }} strokeWidth={1.5} />
                <span className="text-sm text-emerald-800 flex-1">{newYearBanner}</span>
                <button
                  type="button"
                  onClick={() => setNewYearBanner(null)}
                  className="text-xs text-emerald-700/70 hover:text-emerald-800 px-2 py-1"
                >
                  知道了
                </button>
              </div>
            )}

            {/* 命盘信息条 */}
            <Card className={cardClass}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-[#1C1A16] tracking-[0.12em]">
                      {result.meta.fourPillars}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F6F4F1] border border-[#1C1A16]/10 text-[#1C1A16]/70">
                      {result.meta.dayMaster}命
                    </span>
                  </div>
                  <p className="text-xs text-[#1C1A16]/45 mt-1">
                    {birthDate} · 属{result.meta.zodiac} · {result.meta.dayunStart} · {result.meta.mingGe.geju}（日主{result.meta.mingGe.rizhuStrength}）
                  </p>
                </div>
                <div className="flex-1" />
                {currentDayun && (
                  <div className="rounded-xl bg-[#F6F4F1] border border-[#1C1A16]/8 px-4 py-2.5 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-[#1C1A16]/50">当前大运</p>
                      {result.summary.currentAge !== null && (
                        <div className="flex-1 h-1 rounded-full bg-[#1C1A16]/8 overflow-hidden" aria-hidden>
                          <div
                            className="h-full rounded-full"
                            style={{
                              background: '#059669',
                              width: `${Math.round(
                                (Math.min(
                                  Math.max(result.summary.currentAge - currentDayun.ageStart, 0),
                                  currentDayun.ageEnd - currentDayun.ageStart,
                                ) /
                                  (currentDayun.ageEnd - currentDayun.ageStart + 1)) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1C1A16] mt-1">
                      {currentDayun.tenGod} · {currentDayun.ganZhi}
                      <span className="ml-2 text-[#1C1A16]/55 font-normal">
                        {currentDayun.ageStart}-{currentDayun.ageEnd}岁（{currentDayun.yearStart}-{currentDayun.yearEnd}）
                      </span>
                    </p>
                    {nextDayun && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#1C1A16]/55">
                        <span>
                          {dayunCountdownDays !== null
                            ? `距换 ${nextDayun.ganZhi} 大运（${nextDayun.tenGod}）约 ${dayunCountdownDays} 天`
                            : `下一步 ${nextDayun.ganZhi} 大运（${nextDayun.tenGod}），${nextDayun.yearStart} 年起`}
                        </span>
                        {remindState === 'done' ? (
                          <span className="text-emerald-700">已订阅提醒 ✓</span>
                        ) : remindState === 'need-login' ? (
                          <span className="text-amber-700">登录后可订阅提醒</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemind(nextDayun.yearStart, nextDayun.ganZhi)}
                            disabled={remindState === 'saving'}
                            className="inline-flex items-center gap-1 font-medium hover:gap-1.5 transition-all disabled:opacity-50"
                            style={{ color: '#059669' }}
                          >
                            <BellRing className="w-3 h-3" strokeWidth={1.5} />
                            换运时提醒我
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[11px] text-[#1C1A16]/50">当前年龄 / 流年</p>
                  <p className="text-sm font-medium text-[#1C1A16] mt-0.5">
                    {result.summary.currentAge !== null ? `${result.summary.currentAge}岁` : '—'} · {result.summary.currentYear}{' '}
                    {currentPoint?.ganzhi ?? ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm((v) => {
                      const next = !v;
                      if (next) {
                        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1C1A16]/25 bg-white px-3.5 py-2 text-sm text-[#1C1A16] hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {showForm ? '收起' : '重算'}
                </button>
              </div>
            </Card>

            {/* 回测卡：先验过去，再看未来 */}
            {backtest && (
              <BacktestCard
                pick={backtest}
                birthKey={backtestBirthKey}
                className={cardClass}
                onVote={handleBacktestVote}
                onExploreFuture={scrollToChart}
              />
            )}

            {/* 运势K线 */}
            <div ref={chartCardRef}>
              <Card className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                    <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">运势K线</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/life-kline/compare"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/60 hover:text-[#1C1A16] border border-[#1C1A16]/15 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      合盘对比
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShareOpen(true);
                        track('share_card_open', { tool: 'life_kline' });
                      }}
                      disabled={exporting}
                      className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/60 hover:text-[#1C1A16] border border-[#1C1A16]/15 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {exporting ? '导出中...' : '分享'}
                    </button>
                  </div>
                </div>
                <LifeKlineChart
                  points={result.points}
                  currentAge={result.summary.currentAge}
                  mingGe={{ yongShen: result.meta.mingGe.yongShen, jiShen: result.meta.mingGe.jiShen }}
                  vipUnlocked={vipUnlocked}
                  onPaywall={handlePaywall}
                  onYearClick={handleYearClick}
                  onAskAi={handleAskAiYear}
                  onDimSwitch={(dim: DimKey, active: boolean) => track('kline_dim_switch', { dim, active })}
                />
                {monthDrill.loading && (
                  <div className="mt-4 flex items-center justify-center gap-2 py-6 text-sm text-[#1C1A16]/50">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-accent" />
                    正在推演流月...
                  </div>
                )}
                {monthDrill.data && (
                  <MonthDrill
                    data={monthDrill.data}
                    mingGe={{ yongShen: result.meta.mingGe.yongShen, jiShen: result.meta.mingGe.jiShen }}
                    onAskAi={(q) => injectChatQuestion(q, 'month_drill')}
                    onClose={() => setMonthDrill({ loading: false, data: null })}
                  />
                )}
                <p className="mt-4 text-[11px] leading-relaxed text-[#1C1A16]/40">
                  本分析基于传统命理推算，仅供参考与娱乐。人生走向取决于个人的选择、努力和际遇，运势只是参考的风向，而你才是掌舵的人。
                </p>
              </Card>
            </div>

            {/* 当前坐标 */}
            {currentPoint && (
              <Card className={cardClass}>
                <div className="flex items-center gap-2 mb-4">
                  <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">当前坐标</h2>
                  <span className="text-sm text-[#1C1A16]/50">
                    {currentPoint.year}年 · {currentPoint.age}岁
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${LEVEL_STYLE[currentPoint.level]}`}>
                    {currentPoint.level}
                  </span>
                  <span className="text-sm text-[#1C1A16]/70">{currentPoint.comment}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['开盘', currentPoint.open],
                    ['收盘', currentPoint.close],
                    ['最高', currentPoint.high],
                    ['最低', currentPoint.low],
                  ] as const).map(([label, v]) => (
                    <div key={label} className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-4 py-3">
                      <p className="text-[11px] text-[#1C1A16]/50">{label}</p>
                      <p className="text-xl font-semibold text-[#1C1A16] mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#1C1A16]/60">
                  <span>
                    年内涨跌 <DeltaText value={currentPoint.close - currentPoint.open} />
                  </span>
                  {prevPoint && (
                    <span>
                      同比变化 <DeltaText value={currentPoint.close - prevPoint.close} />
                    </span>
                  )}
                  <span>
                    振幅 <span className="font-medium text-[#1C1A16]">{currentPoint.high - currentPoint.low}</span>
                  </span>
                  <span>
                    当前流年 <span className="font-medium text-[#1C1A16]">{currentPoint.ganzhi}</span>
                  </span>
                </div>
              </Card>
            )}

            {/* 人生剧本（P2-A：叙事化包装） */}
            {narrative.length > 0 && (
              <Card className={cardClass}>
                <div className="flex items-center gap-2 mb-3">
                  <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">人生剧本</h2>
                  <ScrollText className="w-4 h-4 text-[#1C1A16]/30" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  {narrative.map((s) => (
                    <p key={s} className="text-sm leading-relaxed text-[#1C1A16]/75">
                      {s}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {/* 运势概览 */}
            <Card className={cardClass}>
              <div className="flex items-center gap-2 mb-4">
                <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">运势概览</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div>
                  <p className="text-xs text-[#1C1A16]/50">最佳十年</p>
                  <p className="text-lg font-semibold text-emerald-600 mt-1">
                    {result.summary.bestDecade.ageStart}-{result.summary.bestDecade.ageEnd}岁
                  </p>
                  <p className="text-xs text-[#1C1A16]/45">均分 {result.summary.bestDecade.avg}</p>
                </div>
                <div>
                  <p className="text-xs text-[#1C1A16]/50">最具挑战十年</p>
                  <p className="text-lg font-semibold text-red-500 mt-1">
                    {result.summary.worstDecade.ageStart}-{result.summary.worstDecade.ageEnd}岁
                  </p>
                  <p className="text-xs text-[#1C1A16]/45">均分 {result.summary.worstDecade.avg}</p>
                </div>
                <div>
                  <p className="text-xs text-[#1C1A16]/50">当前阶段</p>
                  <p className="text-lg font-semibold text-[#1C1A16] mt-1">{result.summary.currentPhase}</p>
                </div>
                <div>
                  <p className="text-xs text-[#1C1A16]/50">运势巅峰</p>
                  <p className="text-lg font-semibold text-emerald-600 mt-1">
                    {result.summary.peak.year}年 <span className="text-sm font-normal">({result.summary.peak.age}岁)</span>
                  </p>
                  <p className="text-xs text-[#1C1A16]/45">{result.summary.peak.level}（{result.summary.peak.score}）</p>
                </div>
                <div>
                  <p className="text-xs text-[#1C1A16]/50">运势低谷</p>
                  <p className="text-lg font-semibold text-red-500 mt-1">
                    {result.summary.trough.year}年 <span className="text-sm font-normal">({result.summary.trough.age}岁)</span>
                  </p>
                  <p className="text-xs text-[#1C1A16]/45">{result.summary.trough.level}（{result.summary.trough.score}）</p>
                </div>
              </div>
            </Card>

            {/* AI 问答 */}
            <div ref={chatSectionRef}>
              <BaziChatSection
                baziData={{
                  dayMaster: result.meta.dayMaster,
                  mingGe: result.meta.mingGe,
                  aiAnalysis: klineSummary,
                }}
                birthInput={{
                  birthDate,
                  gender: gender === 'female' ? 'female' : 'male',
                  knowTime: shichenToHour(Number(birthHour)) !== undefined,
                  birthHourNum: shichenToHour(Number(birthHour)),
                  birthMinute: 0,
                }}
                isLoggedIn={status === 'authenticated'}
                isVip={isMember}
                title="AI 问答"
                subtitle="对K线有疑问？问问 AI 命理师"
                presetQuestions={KLINE_PRESET_QUESTIONS}
                injectQuestion={chatInject}
              />
            </div>
          </div>

          {/* 分享弹层（P0-B）：分享卡为主，完整图导出为次级入口 */}
          <LifeKlineShareDialog
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            result={result}
            birthDate={computedFor?.d ?? birthDate}
            onExportFull={handleExport}
          />

          {/* 付费墙（P1-A/P1-B）：深度与颗粒度付费，信任与传播免费 */}
          <Modal
            isOpen={paywall !== null}
            onClose={() => setPaywall(null)}
            title={paywall === 'dims' ? '解锁四维运势曲线' : '解锁流月下钻'}
            size="sm"
          >
            <div className="text-center">
              <div className="mx-auto w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                <Lock className="w-6 h-6" strokeWidth={1.5} style={{ color: '#059669' }} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#1C1A16]/70">
                {paywall === 'dims'
                  ? '财运、事业、感情、健康四条独立曲线——同一年可以利财不利婚，总运一条线说不清的，四维给你拆开看。'
                  : '点开任意一年，看 12 根流月K线：哪个月宜进、哪个月宜守，把节奏精确到月。'}
              </p>
              <button
                type="button"
                onClick={() => {
                  track('kline_dim_paywall_click', { feature: paywall });
                  window.location.href = '/pricing';
                }}
                className="mt-5 w-full rounded-lg bg-brand-accent text-white font-semibold tracking-[0.08em] text-sm px-4 py-2.5 hover:bg-brand-accent-hover transition-colors"
              >
                升级专业版解锁
              </button>
              <p className="mt-2 text-[11px] text-[#1C1A16]/40">专业版 $49/年 · 全站 AI 与深度功能不限量</p>
            </div>
          </Modal>
        </PageShell>
      )}

      {/* 核心功能 */}
      <PageShell width="wide" className="py-10 md:py-14">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1C1A16] text-center">人生K线的核心功能</h2>
        <p className="mt-2 text-sm text-[#1C1A16]/50 text-center">将传统命理与现代数据可视化结合，用金融K线的方式呈现一生运势节奏</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ background: '#059669' }}
              />
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                <f.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: '#059669' }} />
              </div>
              <h3 className="mt-4 font-medium text-[#1C1A16]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </PageShell>

      {/* 如何使用（#F6F4F1 色带区块） */}
      <div className="bg-[#F6F4F1]">
        <PageShell width="wide" className="py-10 md:py-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1C1A16] text-center">如何使用人生K线</h2>
          <p className="mt-2 text-sm text-[#1C1A16]/50 text-center">三步即可查看您的百年运势图</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-[#1C1A16]/8 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                    <s.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: '#059669' }} />
                  </div>
                  <span className="font-display text-xs font-semibold tracking-[0.12em]" style={{ color: '#059669' }}>
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-medium text-[#1C1A16]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </div>

      {/* 常见问题 */}
      <PageShell width="wide" className="pt-10 md:pt-14 pb-12 md:pb-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1C1A16] text-center mb-8">常见问题</h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group rounded-xl border border-[#1C1A16]/8 bg-white px-5 py-4 transition-colors hover:border-[#1C1A16]/20">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-medium text-[#1C1A16]">
                {item.q}
                <ChevronDown className="w-4 h-4 shrink-0 text-[#1C1A16]/40 group-open:rotate-180 transition-transform" strokeWidth={1.5} />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/65">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-[#1C1A16]/40">
          本服务仅供娱乐之用。重要决策应结合个人认知积累、生活经历及专业建议综合考虑。
        </p>
      </PageShell>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { getLunarDate } from '@/lib/bazi/calculator';
import { Footer } from '@/components/layout/Footer';
import { PageShell } from '@/components/ui/PageShell';
import { DatePicker } from '@/components/ui/DatePicker';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import {
  ZiweiFeatures,
  ZiweiGuide,
  ZiweiFaq,
  SHICHEN_OPTIONS,
} from '@/components/ziwei';
import type { PalaceData, CenterUserInfo } from '@/components/ziwei';
import { track } from '@/lib/analytics';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';
import { calcZiweiDayun, juNumberFromName } from '@/lib/ziwei/dayun';
import { buildZiweiQuickRead, buildSihuaNarrative } from '@/lib/ziwei/quickRead';
import type { TianGan } from '@/lib/ziwei/types';

const _loadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
  </div>
);

const PalaceGrid = dynamic(() => import('@/components/ziwei/PalaceGrid').then(m => m.PalaceGrid), { ssr: false, loading: _loadingSpinner });
const PalaceMobileList = dynamic(() => import('@/components/ziwei/PalaceMobileList').then(m => m.PalaceMobileList), { ssr: false, loading: _loadingSpinner });
const PalaceDetailPanel = dynamic(() => import('@/components/ziwei/PalaceDetailPanel').then(m => m.PalaceDetailPanel), { ssr: false, loading: _loadingSpinner });
const CenterInfoCard = dynamic(() => import('@/components/ziwei/CenterInfoCard').then(m => m.CenterInfoCard), { ssr: false, loading: _loadingSpinner });
const ChartShareButton = dynamic(() => import('@/components/ziwei/ChartShareButton').then(m => m.ChartShareButton), { ssr: false, loading: _loadingSpinner });
const DayunSwitcher = dynamic(() => import('@/components/ziwei/DayunSwitcher').then(m => m.DayunSwitcher), { ssr: false, loading: _loadingSpinner });
// —— V2 新增（PRD-ZIWEI-V2）：真实解读组件，替换 V1 静态假 AI（ZiweiAiOverview/SihuaAnimation/DualChartCompare 已删） ——
const ZiweiQuickReadCard = dynamic(() => import('@/components/ziwei/ZiweiQuickReadCard').then(m => m.ZiweiQuickReadCard), { ssr: false, loading: _loadingSpinner });
const SihuaNarrativeCard = dynamic(() => import('@/components/ziwei/SihuaNarrativeCard').then(m => m.SihuaNarrativeCard), { ssr: false, loading: _loadingSpinner });
const ZiweiAiSection = dynamic(() => import('@/components/ziwei/ZiweiAiSection').then(m => m.ZiweiAiSection), { ssr: false, loading: _loadingSpinner });

interface ApiPalace {
  name: string;
  branch: string;
  stem: string;
  majorStars: Array<{ name: string; type: string; brightness?: string; sihua?: string }>;
  minorStars: Array<{ name: string; type: string; brightness?: string; sihua?: string }>;
  auxiliaryStars?: Array<{ name: string; type: string; brightness?: string; sihua?: string }>;
  isLife?: boolean;
  isBody?: boolean;
}

interface ZiweiApiResponse {
  palaces: ApiPalace[];
  wuxingju: string;
  mingzhu: string;
  shenzhu: string;
  mingGong: string;
  shenGong: string;
  lunar: {
    year: string;
    month: number;
    day: number;
    lunarDate: string;
    isLeapMonth: boolean;
  };
  error?: string;
}

function convertApiPalaces(apiPalaces: ApiPalace[]): PalaceData[] {
  return apiPalaces.map((p) => ({
    name: p.name,
    branch: p.branch,
    stem: p.stem,
    majorStars: (p.majorStars || []).map((s) => ({
      name: s.name,
      type: s.type as PalaceData['majorStars'][number]['type'],
      brightness: s.brightness as PalaceData['majorStars'][number]['brightness'],
      sihua: s.sihua as PalaceData['majorStars'][number]['sihua'], // V2：透传生年四化
    })),
    minorStars: [
      ...(p.minorStars || []),
      ...(p.auxiliaryStars || []),
    ].map((s) => ({
      name: s.name,
      type: s.type as PalaceData['minorStars'][number]['type'],
      brightness: s.brightness as PalaceData['minorStars'][number]['brightness'],
      sihua: s.sihua as PalaceData['minorStars'][number]['sihua'],
    })),
    isLife: p.isLife,
    isBody: p.isBody, // V2：身宫（速读/详情面板用）
  }));
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const SHICHEN_TIME_MAP: Record<string, string> = {
  '0': '23:00-00:59', '1': '01:00-02:59', '2': '03:00-04:59',
  '3': '05:00-06:59', '4': '07:00-08:59', '5': '09:00-10:59',
  '6': '11:00-12:59', '7': '13:00-14:59', '8': '15:00-16:59',
  '9': '17:00-18:59', '10': '19:00-20:59', '11': '21:00-22:59',
};

const CACHE_KEY = 'cyberfate_ziwei_cache';
const CACHE_VERSION = '3.0'; // 版本号，修改后自动清除旧缓存（3.0：V2 增加 yearGanZhi/sihua/isBody）

interface ChartMeta {
  wuxingju: string;
  mingzhu: string;
  shenzhu: string;
  /** 生年干支（排盘 debug 口径，立春为界），大限/四化推算依赖 */
  yearGanZhi?: string;
}

interface CachedResult {
  palaces: PalaceData[];
  birthDate: string;
  birthHour: string;
  gender: string;
  meta?: ChartMeta;
  timestamp: number;
  version?: string;
}

function loadCachedResult(): CachedResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedResult;

    // 版本不匹配，清除旧缓存
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    if (Date.now() - data.timestamp > 7 * 24 * 3600 * 1000) return null;

    // null-safe: 修正 palaces 中可能缺失的 majorStars/minorStars 数组
    if (Array.isArray(data.palaces)) {
      data.palaces = data.palaces.map((p) => ({
        ...p,
        majorStars: Array.isArray(p?.majorStars) ? p.majorStars : [],
        minorStars: Array.isArray(p?.minorStars) ? p.minorStars : [],
      }));
    }

    return data;
  } catch {
    return null;
  }
}

function saveCachedResult(result: CachedResult) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch {
    // quota exceeded
  }
}

export default function ZiweiPage() {
  // 表单状态（预填示例数据）
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthHour, setBirthHour] = useState('3');
  const [gender, setGender] = useState('male');

  // 验证状态
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // 结果状态
  const [palaces, setPalaces] = useState<PalaceData[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);

  // API 返回的命盘元信息
  const [chartMeta, setChartMeta] = useState<ChartMeta | null>(null);

  // 入场动画
  const [gridAnimated, setGridAnimated] = useState(false);

  // 是否为首屏默认示例盘（P0-C：明确标注，输入自己生日排盘后消失）
  const [isSampleChart, setIsSampleChart] = useState(false);

  // AI 统一门禁（游客 401 弹登录 / 未订阅弹升级）
  const { status } = useSession();
  const gate = useAiGate(status === 'authenticated');

  // 会员态（全盘详批 VIP 专属入口的展示分层；服务端仍是最终裁决）
  const [isMember, setIsMember] = useState(false);
  useEffect(() => {
    if (status !== 'authenticated') { setIsMember(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/quota');
        if (!res.ok) return;
        const data = (await res.json()) as { isMember?: boolean };
        if (!cancelled) setIsMember(Boolean(data?.isMember));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [status]);

  // 宫位详情「AI 深读此宫」→ 触发下方 AI 区生成
  const [requestPalace, setRequestPalace] = useState<{ name: string; nonce: number } | null>(null);

  // —— V2 派生数据（全部本地确定性计算，零 AI 成本）——
  const dayunList = useMemo(() => {
    if (!palaces.length || !chartMeta?.yearGanZhi || !chartMeta?.wuxingju) return [];
    const ju = juNumberFromName(chartMeta.wuxingju);
    const birthYear = Number(birthDate?.slice(0, 4));
    if (!ju || !birthYear) return [];
    try {
      return calcZiweiDayun(palaces, {
        yearGan: chartMeta.yearGanZhi[0] as TianGan,
        gender: gender === 'female' ? 'female' : 'male',
        birthYear,
        juNumber: ju,
        currentYear: new Date().getFullYear(),
      });
    } catch { return []; }
  }, [palaces, chartMeta, birthDate, gender]);

  const quickReadLines = useMemo(() => {
    if (!palaces.length) return [];
    try {
      return buildZiweiQuickRead({
        palaces,
        mingzhu: chartMeta?.mingzhu,
        shenzhu: chartMeta?.shenzhu,
        wuxingJu: chartMeta?.wuxingju,
        dayunList,
      });
    } catch { return []; }
  }, [palaces, chartMeta, dayunList]);

  const sihuaItems = useMemo(() => {
    if (!palaces.length || !chartMeta?.yearGanZhi) return [];
    try {
      return buildSihuaNarrative(palaces, chartMeta.yearGanZhi[0] as TianGan);
    } catch { return []; }
  }, [palaces, chartMeta]);

  const selectedPalace = useMemo(() => {
    if (selectedPalaceIndex === null || !palaces[selectedPalaceIndex]) return null;
    return palaces[selectedPalaceIndex];
  }, [selectedPalaceIndex, palaces]);

  const centerUserInfo = useMemo<CenterUserInfo | undefined>(() => {
    if (!showChart || palaces.length === 0) return undefined;

    let lunarBirthday: string | undefined;
    try {
      lunarBirthday = `农历${getLunarDate(birthDate)}`;
    } catch {
      // 日期无效时不显示农历
    }

    return {
      gender: gender as 'male' | 'female',
      wuxingju: chartMeta?.wuxingju,
      mingzhu: chartMeta?.mingzhu,
      shenzhu: chartMeta?.shenzhu,
      inputTime: SHICHEN_TIME_MAP[birthHour],
      solarBirthday: birthDate,
      lunarBirthday,
    };
  }, [showChart, palaces, birthDate, birthHour, gender, chartMeta]);

  // P1-4: 首次进入 — 恢复缓存或用默认参数调用 API 展示示例命盘
  useEffect(() => {
    const cached = loadCachedResult();
    if (cached) {
      setPalaces(cached.palaces);
      setBirthDate(cached.birthDate);
      setBirthHour(cached.birthHour);
      setGender(cached.gender);
      if (cached.meta) setChartMeta(cached.meta);
      setShowChart(true);
      setSelectedPalaceIndex(0);
      setTimeout(() => setGridAnimated(true), 100);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ziwei', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birthDate, hour: Number(birthHour), gender }),
        });
        if (!res.ok) throw new Error('初始排盘失败');
        const data: ZiweiApiResponse = await res.json();
        if (cancelled) return;
        const result = convertApiPalaces(data.palaces);
        setPalaces(result);
        setChartMeta({ wuxingju: data.wuxingju, mingzhu: data.mingzhu, shenzhu: data.shenzhu, yearGanZhi: data.lunar?.year });
        setIsSampleChart(true); // 默认参数排出的示例盘
        setShowChart(true);
        setSelectedPalaceIndex(0);
        setTimeout(() => setGridAnimated(true), 100);
      } catch {
        // 首次加载失败静默处理，用户可手动点击排盘
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!birthDate) newErrors.birthDate = true;
    if (!birthHour) newErrors.birthHour = true;
    if (!gender) newErrors.gender = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthDate, birthHour, gender]);

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setGridAnimated(false);
    const startTime = Date.now();
    track('tool_ai_trigger', { tool: 'ziwei' });

    try {
      const res = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          hour: Number(birthHour),
          gender,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        // 命中统一门禁（游客未登录弹登录 / 未订阅弹升级）：直接弹窗中止，不走缓存兜底
        if (gate.handle(res.status, errBody.code || errBody.error)) {
          setLoading(false);
          return;
        }
        throw new Error(errBody.error || `请求失败 (${res.status})`);
      }

      const data: ZiweiApiResponse = await res.json();
      if (data.error) throw new Error(data.error);

      const result = convertApiPalaces(data.palaces);
      const meta: ChartMeta = {
        wuxingju: data.wuxingju,
        mingzhu: data.mingzhu,
        shenzhu: data.shenzhu,
        yearGanZhi: data.lunar?.year,
      };

      setPalaces(result);
      setChartMeta(meta);
      setIsSampleChart(false); // 用户主动排盘，不再是示例
      setShowChart(true);
      setSelectedPalaceIndex(0);

      saveCachedResult({
        palaces: result,
        birthDate,
        birthHour,
        gender,
        meta,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      });

      setTimeout(() => setGridAnimated(true), 100);
      track('tool_ai_complete', { tool: 'ziwei', duration_ms: Date.now() - startTime });
      track('ziwei_paipan_complete'); // V2 漏斗起点（P0-C）
    } catch (err) {
      const cached = loadCachedResult();
      if (cached) {
        setPalaces(cached.palaces);
        if (cached.meta) setChartMeta(cached.meta);
        setShowChart(true);
        setSelectedPalaceIndex(0);
        track('tool_ai_error', { tool: 'ziwei', error_type: 'api_error' });
        setError('网络异常，已显示上次缓存的结果');
        setTimeout(() => setGridAnimated(true), 100);
      } else {
        track('tool_ai_error', { tool: 'ziwei', error_type: 'api_error' });
        setError(err instanceof Error ? err.message : '排盘失败，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePalaceSelect = useCallback((idx: number | null) => {
    setSelectedPalaceIndex(idx);
    if (idx !== null && palaces[idx]) track('ziwei_palace_click', { palace: palaces[idx].name });
  }, [palaces]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-[#FAF9F6]">
      {/* 标题区 */}
      <div className="relative overflow-hidden">
        {/* 罗盘细线装饰（品牌母题，≤6% 透明度） */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] md:w-[460px] md:h-[460px] opacity-[0.05]"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="196" fill="none" stroke="#1C1A16" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="#1C1A16" strokeWidth="0.6" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="#1C1A16" strokeWidth="0.6" strokeDasharray="2 4" />
            {Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1="200" y1="4" x2="200" y2={i % 2 === 0 ? 14 : 9}
                stroke="#1C1A16" strokeWidth="1"
                transform={`rotate(${i * 15} 200 200)`}
              />
            ))}
          </svg>
        </div>
        <PageShell width="wide" className=" pt-16 md:pt-24 pb-6 md:pb-8">
          <div className="relative text-center">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium tracking-[0.08em]"
              style={{ background: '#F3E8FF', color: '#7E22CE' }}
            >
              紫微斗数
            </span>
            <h1 className="mt-4 font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight">
              AI 紫微斗数排盘
            </h1>
            <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">
              十二宫命盘 · 智能解读
            </p>
          </div>
        </PageShell>
      </div>

      {/* 输入区 */}
      <PageShell width="wide" className=" pb-6 md:pb-8">
        <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* 出生日期 */}
            <div className="flex-1 relative">
              <DatePicker
                value={birthDate}
                onChange={(v) => { setBirthDate(v); clearFieldError('birthDate'); }}
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

            {/* 出生时辰 */}
            <div className="flex-1 relative">
              <Select
                label="出生时辰"
                value={birthHour}
                onChange={(e) => { setBirthHour(e.target.value); clearFieldError('birthHour'); }}
                options={SHICHEN_OPTIONS}
                placeholder="请选择时辰"
                className={
                  errors.birthHour
                    ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200'
                    : 'border-[#E8E4DD] focus:border-brand-accent'
                }
              />
              {errors.birthHour && (
                <span className="absolute -bottom-5 left-0 text-[11px] text-red-500">请选择出生时辰</span>
              )}
            </div>

            {/* 性别 */}
            <div className="flex-1" role="group" aria-labelledby="ziwei-gender-label">
              <label id="ziwei-gender-label" className="block text-sm font-medium text-[#1C1A16] mb-2">性别</label>
              <SegmentControl
                options={GENDER_OPTIONS}
                value={gender}
                onChange={(v) => { setGender(v); clearFieldError('gender'); }}
              />
            </div>

            {/* 排盘按钮 */}
            <div className="md:shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                className="w-full md:w-auto whitespace-nowrap"
              >
                开始排盘
              </Button>
            </div>
          </div>
        </div>
      </PageShell>

      {/* 错误提示 */}
      {error && (
        <PageShell width="wide" className=" pb-4">
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

      {/* 命盘加载态 */}
      {loading && (
        <PageShell width="wide" className=" pb-10 md:pb-16">
          <div className="flex flex-col items-center justify-center py-20">
            <BaguaSpinner />
            <p className="mt-4 text-sm text-[#1C1A16]/50">正在排盘中...</p>
          </div>
        </PageShell>
      )}

      {/* 命盘区域 — 桌面 lg+ master-detail：左命盘(sticky) | 右详情/四化/大运/AI；
          <lg 竖向堆叠（asidePosition=left → aside 先 main 后），移动端顺序与间距保持原样 */}
      {showChart && !loading && palaces.length > 0 && (
        <PageShell width="wide" className=" pb-6 md:pb-8">
          {/* 单栏：命盘在上、详情/四化/大运/AI 在下,整页自然滚动(桌面不再两栏 sticky,避免留白/停靠)。
              命盘内部 hidden md:block / md:hidden 分支未动。 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                {/* 命盘卡片（内部桌面 4×4 网格 + 移动端信息卡/列表分支，整体原样搬迁，未改内部） */}
                <div className="bg-white rounded-2xl border border-[#1C1A16]/8 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div />
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] text-center flex-1">
                      命盘
                      {isSampleChart && (
                        <span
                          className="ml-2 align-middle inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-normal"
                          style={{ background: '#F3E8FF', color: '#7E22CE' }}
                        >
                          示例盘 · 输入你的生日排自己的盘
                        </span>
                      )}
                    </h2>
                    {/* P2-1: 分享按钮 */}
                    <ChartShareButton
                      palaces={palaces}
                      birthInfo={{ date: birthDate, hour: birthHour, gender }}
                    />
                  </div>
                  <p className="text-xs text-[#1C1A16]/40 text-center mb-5">
                    点击宫格查看详情 · 点击星曜名查看解释
                  </p>

                  {/* P2-6: 入场动画 - 桌面端 */}
                  <div className="hidden md:block">
                    <div
                      className={`transition-all duration-700 ${
                        gridAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      <PalaceGrid
                        palaces={palaces}
                        selectedIndex={selectedPalaceIndex}
                        onSelect={handlePalaceSelect}
                        userInfo={centerUserInfo}
                      />
                    </div>
                  </div>

                  {/* 移动端：信息卡片 + 纵向列表 */}
                  <div className="md:hidden">
                    <div
                      className={`transition-all duration-500 ${
                        gridAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <CenterInfoCard
                        userInfo={centerUserInfo}
                        palaces={palaces}
                        className="w-full mb-4"
                      />
                      <PalaceMobileList
                        palaces={palaces}
                        selectedIndex={selectedPalaceIndex}
                        onSelect={handlePalaceSelect}
                      />
                    </div>
                  </div>
                </div>

              </div>
            {/* 详情/速读/四化/大限/AI（V2：全部真实数据，假 AI 已清零） */}
            <div className="min-w-0 flex flex-col gap-4 md:gap-6">
                {/* 命盘速读（P0-A）：三句话读懂盘面/身宫/当前大限 */}
                {quickReadLines.length > 0 && <ZiweiQuickReadCard lines={quickReadLines} />}

                {/* 宫位详情面板（点宫格 → 即时渲染，附「AI 深读此宫」真入口） */}
                {selectedPalace && (
                  <PalaceDetailPanel
                    palace={selectedPalace}
                    onClose={() => setSelectedPalaceIndex(null)}
                    onAiRead={(name) => setRequestPalace({ name, nonce: Date.now() })}
                  />
                )}

                {/* 生年四化叙事（P1-A）：真实四化落宫 + 确定性模板 */}
                {sihuaItems.length > 0 && <SihuaNarrativeCard items={sihuaItems} />}

                {/* 大限流年切换器（P0-A）：真实起限与行进方向 */}
                <DayunSwitcher
                  palaces={palaces}
                  birthDate={birthDate}
                  yearGanZhi={chartMeta?.yearGanZhi}
                  gender={gender === 'female' ? 'female' : 'male'}
                  wuxingJu={chartMeta?.wuxingju}
                />

                {/* 逐宫议题式 AI + 全盘详批（P0-B）：真 AI，免费 3 宫/日 */}
                <ZiweiAiSection
                  birthDate={birthDate}
                  birthHour={birthHour}
                  gender={gender}
                  isVip={isMember}
                  gate={gate}
                  requestPalace={requestPalace}
                />
              </div>
          </div>
        </PageShell>
      )}

      {/* P1-3: 底部功能区（特性区用 #F6F4F1 色带打破单色） */}
      <div className="bg-[#F6F4F1] py-10 md:py-14 mt-2">
        <PageShell width="wide">
          <ZiweiFeatures />
        </PageShell>
      </div>
      <div className="bg-[#FAF9F6] pt-10 md:pt-14">
        <PageShell width="wide" className=" pb-6 md:pb-8">
          <ZiweiGuide />
        </PageShell>

        <PageShell width="wide" className=" pb-8 md:pb-12">
          <ZiweiFaq />
        </PageShell>
      </div>

      <AiGateModals gate={gate} callbackUrl="/ziwei" />
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { getLunarDate } from '@/lib/bazi/calculator';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { DatePicker } from '@/components/ui/DatePicker';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import {
  PalaceGrid,
  PalaceMobileList,
  PalaceDetailPanel,
  CenterInfoCard,
  ZiweiAiOverview,
  ZiweiFeatures,
  ZiweiGuide,
  ZiweiFaq,
  ChartShareButton,
  SihuaAnimation,
  DayunSwitcher,
  DualChartCompare,
  SHICHEN_OPTIONS,
} from '@/components/ziwei';
import type { PalaceData, CenterUserInfo } from '@/components/ziwei';

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
    majorStars: p.majorStars.map((s) => ({
      name: s.name,
      type: s.type as PalaceData['majorStars'][number]['type'],
      brightness: s.brightness as PalaceData['majorStars'][number]['brightness'],
    })),
    minorStars: [
      ...p.minorStars,
      ...(p.auxiliaryStars || []),
    ].map((s) => ({
      name: s.name,
      type: s.type as PalaceData['minorStars'][number]['type'],
      brightness: s.brightness as PalaceData['minorStars'][number]['brightness'],
    })),
    isLife: p.isLife,
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
const CACHE_VERSION = '2.0'; // 版本号，修改后自动清除旧缓存

interface ChartMeta {
  wuxingju: string;
  mingzhu: string;
  shenzhu: string;
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
        setChartMeta({ wuxingju: data.wuxingju, mingzhu: data.mingzhu, shenzhu: data.shenzhu });
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
        throw new Error(errBody.error || `请求失败 (${res.status})`);
      }

      const data: ZiweiApiResponse = await res.json();
      if (data.error) throw new Error(data.error);

      const result = convertApiPalaces(data.palaces);
      const meta: ChartMeta = {
        wuxingju: data.wuxingju,
        mingzhu: data.mingzhu,
        shenzhu: data.shenzhu,
      };

      setPalaces(result);
      setChartMeta(meta);
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
    } catch (err) {
      const cached = loadCachedResult();
      if (cached) {
        setPalaces(cached.palaces);
        if (cached.meta) setChartMeta(cached.meta);
        setShowChart(true);
        setSelectedPalaceIndex(0);
        setError('网络异常，已显示上次缓存的结果');
        setTimeout(() => setGridAnimated(true), 100);
      } else {
        setError(err instanceof Error ? err.message : '排盘失败，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* 面包屑 */}
      <Container className="pt-16 md:pt-24">
        <nav className="flex items-center gap-1.5 text-sm text-[#1C1A16]/50 mb-6" aria-label="面包屑导航">
          <Link href="/" className="hover:text-[#1C1A16] transition-colors">
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1C1A16]">紫微斗数</span>
        </nav>
      </Container>

      {/* 标题区 */}
      <Container className="pb-6 md:pb-8">
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight">
            AI 紫微斗数排盘
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">
            十二宫命盘 · 智能解读
          </p>
        </div>
      </Container>

      {/* 输入区 */}
      <Container className="pb-6 md:pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-4 sm:p-6">
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
                    : 'border-[#E8E4DD] focus:border-[#1C1A16]'
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
                    : 'border-[#E8E4DD] focus:border-[#1C1A16]'
                }
              />
              {errors.birthHour && (
                <span className="absolute -bottom-5 left-0 text-[11px] text-red-500">请选择出生时辰</span>
              )}
            </div>

            {/* 性别 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#1C1A16] mb-2">性别</label>
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
      </Container>

      {/* 错误提示 */}
      {error && (
        <Container className="pb-4">
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
        </Container>
      )}

      {/* 命盘加载态 */}
      {loading && (
        <Container className="pb-10 md:pb-16">
          <div className="flex flex-col items-center justify-center py-20">
            <BaguaSpinner />
            <p className="mt-4 text-sm text-[#1C1A16]/50">正在排盘中...</p>
          </div>
        </Container>
      )}

      {/* 命盘区域 */}
      {showChart && !loading && palaces.length > 0 && (
        <>
          <Container className="pb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <div />
                <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] text-center flex-1">
                  命盘
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
                    onSelect={setSelectedPalaceIndex}
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
                    onSelect={setSelectedPalaceIndex}
                  />
                </div>
              </div>
            </div>
          </Container>

          {/* P2-4: 双人对比入口 */}
          <Container className="pb-4">
            <div className="flex justify-end">
              <DualChartCompare chartA={palaces} />
            </div>
          </Container>

          {/* P1-1: 宫位详情面板 */}
          {selectedPalace && (
            <Container className="pb-4 md:pb-6">
              <PalaceDetailPanel
                palace={selectedPalace}
                onClose={() => setSelectedPalaceIndex(null)}
              />
            </Container>
          )}

          {/* P2-2: 四化飞星动画 */}
          <Container className="pb-4 md:pb-6">
            <SihuaAnimation palaces={palaces} visible={showChart && !loading} />
          </Container>

          {/* P2-3: 大运流年切换器 */}
          <Container className="pb-4 md:pb-6">
            <DayunSwitcher birthDate={birthDate} />
          </Container>

          {/* P1-2: AI 命盘总览解读 */}
          <Container className="pb-6 md:pb-8">
            <ZiweiAiOverview palaces={palaces} birthDate={birthDate} />
          </Container>
        </>
      )}

      {/* P1-3: 底部功能区 */}
      <div className="bg-[#FAF9F6]">
        <Container className="pb-6 md:pb-8">
          <ZiweiFeatures />
        </Container>

        <Container className="pb-6 md:pb-8">
          <ZiweiGuide />
        </Container>

        <Container className="pb-8 md:pb-12">
          <ZiweiFaq />
        </Container>
      </div>

      <Footer />
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
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
  ZiweiAiOverview,
  ZiweiFeatures,
  ZiweiGuide,
  ZiweiFaq,
  ChartShareButton,
  SihuaAnimation,
  DayunSwitcher,
  DualChartCompare,
  SHICHEN_OPTIONS,
  MOCK_PALACES,
} from '@/components/ziwei';
import type { PalaceData } from '@/components/ziwei';

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const CACHE_KEY = 'cyberfate_ziwei_cache';

interface CachedResult {
  palaces: PalaceData[];
  birthDate: string;
  birthHour: string;
  gender: string;
  timestamp: number;
}

function loadCachedResult(): CachedResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedResult;
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

  // 入场动画
  const [gridAnimated, setGridAnimated] = useState(false);

  const selectedPalace = useMemo(() => {
    if (selectedPalaceIndex === null || !palaces[selectedPalaceIndex]) return null;
    return palaces[selectedPalaceIndex];
  }, [selectedPalaceIndex, palaces]);

  // P1-4: 首次进入自动展示示例命盘
  useEffect(() => {
    const cached = loadCachedResult();
    if (cached) {
      setPalaces(cached.palaces);
      setBirthDate(cached.birthDate);
      setBirthHour(cached.birthHour);
      setGender(cached.gender);
      setShowChart(true);
      setSelectedPalaceIndex(0);
      setTimeout(() => setGridAnimated(true), 100);
    } else {
      setPalaces(MOCK_PALACES);
      setShowChart(true);
      setSelectedPalaceIndex(0);
      setTimeout(() => setGridAnimated(true), 100);
    }
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
      // 模拟排盘计算，后续接真实 API
      await new Promise((r) => setTimeout(r, 800));

      // 模拟偶尔的网络错误以测试错误处理
      // if (Math.random() < 0.1) throw new Error('网络异常');

      const result = MOCK_PALACES;
      setPalaces(result);
      setShowChart(true);
      setSelectedPalaceIndex(0);

      saveCachedResult({
        palaces: result,
        birthDate,
        birthHour,
        gender,
        timestamp: Date.now(),
      });

      setTimeout(() => setGridAnimated(true), 100);
    } catch (err) {
      const cached = loadCachedResult();
      if (cached) {
        setPalaces(cached.palaces);
        setShowChart(true);
        setSelectedPalaceIndex(0);
        setError('网络异常，已显示上次缓存的结果');
        setTimeout(() => setGridAnimated(true), 100);
      } else {
        setError('排盘失败，请检查网络后重试');
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
      <Container className="pt-20 md:pt-24">
        <nav className="flex items-center gap-1.5 text-sm text-[#1C1A16]/50 mb-6" aria-label="面包屑导航">
          <Link href="/" className="hover:text-[#1C1A16] transition-colors">
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1C1A16]">紫微斗数</span>
        </nav>
      </Container>

      {/* 标题区 */}
      <Container className="pb-8">
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
      <Container className="pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6">
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
        <Container className="pb-16">
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
                  />
                </div>
              </div>

              {/* 移动端：纵向列表 */}
              <div className="md:hidden">
                <div
                  className={`transition-all duration-500 ${
                    gridAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
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
            <Container className="pb-6">
              <PalaceDetailPanel
                palace={selectedPalace}
                onClose={() => setSelectedPalaceIndex(null)}
              />
            </Container>
          )}

          {/* P2-2: 四化飞星动画 */}
          <Container className="pb-6">
            <SihuaAnimation palaces={palaces} visible={showChart && !loading} />
          </Container>

          {/* P2-3: 大运流年切换器 */}
          <Container className="pb-6">
            <DayunSwitcher birthDate={birthDate} />
          </Container>

          {/* P1-2: AI 命盘总览解读 */}
          <Container className="pb-8">
            <ZiweiAiOverview palaces={palaces} birthDate={birthDate} />
          </Container>
        </>
      )}

      {/* P1-3: 底部功能区 */}
      <div className="bg-[#FAF9F6]">
        <Container className="pb-8">
          <ZiweiFeatures />
        </Container>

        <Container className="pb-8">
          <ZiweiGuide />
        </Container>

        <Container className="pb-12">
          <ZiweiFaq />
        </Container>
      </div>

      <Footer />
    </div>
  );
}

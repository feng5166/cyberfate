'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { saveBirthInfo, loadBirthInfo } from '@/lib/utils/storage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingChart } from '@/components/bazi/WuxingChart';
import { FiveDimensionChart } from '@/components/bazi/FiveDimensionChart';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { Container } from '@/components/ui/Container';
import { CitySearch } from '@/components/ui/CitySearch';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Download,
  RefreshCw,
  Share2,
  Brain,
  Briefcase,
  Coins,
  Heart,
  HeartPulse,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { DAYMASTER_TRAITS, WUXING_KEYS, getNaYin, getTenGod } from '@/lib/bazi';
import type { BaziApiResult, PillarRecord, WuxingCount } from '@/lib/bazi/types';

// 十二时辰选项
const shichenOptions = [
  { value: '', label: '请选择时辰' },
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
  { value: '-1', label: '不知道（默认午时）' },
];

type ResultTab = '命理解读' | '性格分析' | '科学客观';

const resultTabs: ResultTab[] = ['命理解读', '性格分析', '科学客观'];

const pillarConfigs: Array<{ key: keyof PillarRecord; label: string }> = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

const wuxingDisplay: Array<{ key: keyof WuxingCount; label: string }> = [
  { key: 'metal', label: '金' },
  { key: 'wood', label: '木' },
  { key: 'water', label: '水' },
  { key: 'fire', label: '火' },
  { key: 'earth', label: '土' },
];

const infoBlockClass = 'rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F9F6] p-5';

export default function BaziPage() {
  const { status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
    birthPlace: '',
  });
  const [loading, setLoading] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>('命理解读');

  useEffect(() => {
    async function loadUserBirthInfo() {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/birth-info');
          if (res.ok) {
            const { data } = await res.json();
            if (data?.birthDate) {
              const localSaved = loadBirthInfo();
              setFormData(prev => ({
                ...prev,
                name: data.nickname || '',
                birthDate: data.birthDate || '',
                birthHour: data.birthHour || '-1',
                gender: data.gender || '',
                birthPlace: localSaved?.birthPlace || prev.birthPlace || '',
              }));
              return;
            }
          }
        } catch (e) {
          console.error('Failed to load birth info:', e);
        }
      }
      const saved = loadBirthInfo();
      if (saved) {
        setFormData(prev => ({
          ...prev,
          birthDate: saved.birthDate || '',
          birthHour: saved.birthHour || '-1',
          gender: saved.gender || '',
          birthPlace: saved.birthPlace || '',
        }));
      }
    }
    if (status !== 'loading') loadUserBirthInfo();
  }, [status]);

  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziApiResult | null>(null);

  const personalityText = useMemo(() => {
    if (!result?.aiAnalysis) return '';
    const match = /【性格特点】([\s\S]*?)(?:\n\n【|$)/.exec(result.aiAnalysis);
    return match ? match[1].trim() : result.aiAnalysis;
  }, [result?.aiAnalysis]);

  const tenGodRows = useMemo(() => {
    if (!result) return [];
    const dayGan = result.pillars.day.gan;
    return pillarConfigs.map(({ key, label }) => {
      const pillar = result.pillars[key];
      return {
        label,
        ganZhi: `${pillar.gan}${pillar.zhi}`,
        tenGod: key === 'day' ? '日主' : getTenGod(dayGan, pillar.gan),
        nayin: getNaYin(pillar.gan, pillar.zhi),
      };
    });
  }, [result]);

  const dayMasterInsight = useMemo(() => {
    if (!result) return null;
    const dayPillar = result.pillars.day;
    const dayElement = dayPillar.ganWuxing;
    const dayKey = WUXING_KEYS[dayElement];
    const dayValue = result.wuxing[dayKey];
    const total = Object.values(result.wuxing).reduce((sum, value) => sum + value, 0);
    const average = total / 5 || 1;
    const delta = dayValue - average;
    let level: '偏旺' | '偏弱' | '平衡' = '平衡';
    let advice = '五行较为均衡，保持当下节奏即可。';
    if (delta >= 1) {
      level = '偏旺';
      advice = '日主力量偏旺，可多做泄耗或用克制五行平衡格局。';
    } else if (delta <= -1) {
      level = '偏弱';
      advice = '日主力量偏弱，适合接触能生扶日主的环境或伙伴。';
    }
    return {
      summary: `${dayPillar.gan}${dayPillar.zhi} · ${dayElement}`,
      trait: DAYMASTER_TRAITS[dayPillar.gan] || '',
      level,
      detail: `日主${level}（${dayValue.toFixed(1)} vs 均值 ${average.toFixed(1)}）`,
      advice,
    };
  }, [result]);

  const wuxingStats = useMemo(() => {
    if (!result) return [];
    const total = Object.values(result.wuxing).reduce((sum, value) => sum + value, 0);
    return wuxingDisplay.map(({ key, label }) => ({
      label,
      value: result.wuxing[key],
      percent: total ? Math.round((result.wuxing[key] / total) * 100) : 0,
    }));
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!formData.birthDate) { setError('请选择出生日期'); return; }
    if (!formData.birthHour) { setError('请选择出生时辰'); return; }

    setLoading(true);
    saveBirthInfo({
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
    });

    if (status === 'authenticated') {
      try {
        await fetch('/api/user/birth-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, birthDate: formData.birthDate, birthHour: formData.birthHour, gender: formData.gender }),
        });
      } catch (e) { console.error('Failed to save:', e); }
    }

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主', gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour),
          birthPlace: formData.birthPlace,
        }),
      });
      const data = (await response.json()) as BaziApiResult & { error?: string };
      if (!response.ok) {
        if (response.status === 401) { window.location.href = '/auth/login?redirect=/bazi'; return; }
        if (data.error === 'QUOTA_EXCEEDED') { setShowQuotaModal(true); return; }
        throw new Error(data.error || '服务器错误，请稍后重试');
      }
      setResult(data);
      setActiveTab('命理解读');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 统一 input 样式
  const inputClass =
    'w-full h-10 rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all';
  const cardClass = 'rounded-2xl border-none shadow-none bg-white hover:shadow-card-hover transition-shadow duration-300';

  return (
    <div className="min-h-screen bg-[#FAF9F9F6]">
      {/* 页面标题 */}
      <div className="text-center pt-10 md:pt-12 pb-8">
        <h1
          className="font-display text-h1 md:text-[44px] text-[#1C1A16]"
          style={{ letterSpacing: '10px' }}
        >
          八字分析
        </h1>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">输入您的出生信息，AI 将为您解读命盘</p>
      </div>

      {/* 主体：左右分栏 */}
      <Container>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20 md:pb-26">
          {/* ===== 左侧：输入表单 ===== */}
          <div className="bazi-input-card flex-shrink-0 w-full lg:w-auto lg:max-w-[440px] rounded-2xl bg-white shadow-none px-6 py-8 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 区块标题 */}
              <h2 className="font-display text-lg text-[#1C1A16]">📋 出生信息</h2>

              {/* 姓名 */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]">姓名</label>
                <input
                  type="text" placeholder="输入您的姓名" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* 性别 - 用 SegmentControl */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]">性别</label>
                <SegmentControl
                  options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]}
                  value={formData.gender}
                  onChange={(v) => setFormData({ ...formData, gender: v })}
                  className="h-10 rounded-lg border border-[#1C1A16]/15 bg-white text-[#1C1A16] overflow-hidden"
                  optionClassName="px-3 py-0 h-full flex items-center justify-center text-sm"
                />
              </div>

              {/* 出生日期 */}
              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="h-10 rounded-lg"
              />

              {/* 出生时辰 */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]">出生时辰</label>
                <Select
                  options={shichenOptions}
                  value={formData.birthHour}
                  onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                  className="h-10 rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16]"
                />
              </div>

              <CitySearch
                label="出生地"
                placeholder="搜索并选择出生地"
                value={formData.birthPlace}
                onInputChange={(value) => setFormData(prev => ({ ...prev, birthPlace: value }))}
                onSelect={(city) => setFormData(prev => ({ ...prev, birthPlace: city.name }))}
              />

              {/* 错误提示 */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                variant="ghost"
                loading={loading}
                className="w-full mt-1 text-[13px] px-[38px] py-[12px] rounded-xl border border-[#1C1A16]/30 text-[#1C1A16] bg-transparent hover:bg-[#1C1A16]/5"
              >
                {loading ? '正在计算...' : '开始分析'}
              </Button>
            </form>
          </div>

          {/* ===== 右侧：结果展示区 ===== */}
          <div className="flex-1 min-w-0">
            {/* 加载中 */}
            {loading && (
              <Card className={`flex flex-col items-center justify-center py-16 ${cardClass}`}>
                <BaguaSpinner size={64} />
                <p className="mt-4 text-[#1C1A16] font-medium">正在计算您的命盘...</p>
                <p className="text-sm text-[#6B7280] mt-2">AI 正在解读中，请稍候</p>
              </Card>
            )}

            {/* 空状态（未分析时）*/}
            {!result && !loading && (
              <Card className={`flex flex-col items-center justify-center py-20 text-center ${cardClass}`}>
                <div className="w-16 h-16 rounded-full bg-[#FAF9F9F6] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[#1C1A16] font-medium text-lg">填写信息后点击开始分析</p>
                <p className="text-sm text-[#6B7280] mt-2">AI 将为您生成专属命盘解读</p>
              </Card>
            )}

            {/* 分析结果 */}
            {result && !loading && (
              <div className="space-y-6 animate-fadeIn">
                <Card className={cardClass}>
                  <div className="flex flex-wrap gap-4 border-b border-[#1C1A16]/10 pb-3">
                    {resultTabs.map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`relative pb-2 text-sm font-medium transition-colors ${
                          activeTab === tab ? 'text-[#1C1A16]' : 'text-[#6B7280]'
                        }`}
                      >
                        {tab}
                        {activeTab === tab && (
                          <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-[#1C1A16]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6">
                    {activeTab === '命理解读' && (
                      <div className="space-y-6">
                        <div className={infoBlockClass}>
                          <BaziChart pillars={result.pillars} />
                        </div>
                        {result.fiveDimensions ? (
                          <div className={infoBlockClass}>
                            <FiveDimensionChart dimensions={result.fiveDimensions} />
                          </div>
                        ) : (
                          <div className={infoBlockClass}>
                            <p className="text-sm text-[#6B7280]">五维运势评分准备中，请稍后重试。</p>
                          </div>
                        )}
                        <div className={infoBlockClass}>
                          <WuxingChart wuxing={result.wuxing} />
                        </div>
                        <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="inline-block bg-[#FAF9F9F6] text-[#1C1A16]/70 text-xs px-2 py-0.5 rounded font-medium">
                              🤖 AI 分析·解读
                            </span>
                          </div>
                          <div className="text-base leading-relaxed text-[#1C1A16]/70 whitespace-pre-wrap">
                            {result.aiAnalysis}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === '性格分析' && (
                      <div className="space-y-6">
                        <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                          <h3 className="text-lg font-semibold text-[#1C1A16] mb-3">性格关键词</h3>
                          <p className="text-sm leading-relaxed text-[#1C1A16]/70 whitespace-pre-wrap">
                            {personalityText || 'AI 正在准备性格解读，请稍候再试。'}
                          </p>
                        </div>
                        {dayMasterInsight && (
                          <div className={infoBlockClass}>
                            <h4 className="text-base font-semibold text-[#1C1A16] mb-2">日主特质</h4>
                            <p className="text-lg font-medium text-[#1C1A16]">{dayMasterInsight.summary}</p>
                            <p className="text-sm text-[#1C1A16]/70 mt-2">{dayMasterInsight.trait}</p>
                            <div className="mt-3 text-xs text-[#6B7280]">{dayMasterInsight.detail}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === '科学客观' && (
                      <div className="space-y-6">
                        {dayMasterInsight && (
                          <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                            <h4 className="text-base font-semibold text-[#1C1A16]">日主五行 & 强弱</h4>
                            <p className="text-lg font-semibold text-[#1C1A16] mt-2">{dayMasterInsight.summary}</p>
                            <p className="text-sm text-[#1C1A16]/70 mt-1">{dayMasterInsight.trait}</p>
                            <p className="text-sm text-[#1C1A16]/80 mt-2">{dayMasterInsight.detail}</p>
                            <p className="text-xs text-[#6B7280] mt-2">{dayMasterInsight.advice}</p>
                          </div>
                        )}
                        <div className={infoBlockClass}>
                          <h4 className="text-base font-semibold text-[#1C1A16]">十神格局 & 纳音</h4>
                          <div className="mt-4 space-y-3">
                            {tenGodRows.map(row => (
                              <div
                                key={row.label}
                                className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#1C1A16]"
                              >
                                <span className="w-12 text-[#6B7280]">{row.label}</span>
                                <span className="font-semibold">{row.ganZhi}</span>
                                <span className="text-[#1C1A16]/70">十神 {row.tenGod}</span>
                                <span className="text-[#1C1A16]/70">纳音 {row.nayin}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className={infoBlockClass}>
                          <h4 className="text-base font-semibold text-[#1C1A16]">五行计数</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                            {wuxingStats.map(stat => (
                              <div key={stat.label} className="text-center">
                                <div className="text-2xl font-semibold text-[#1C1A16]">{stat.value}</div>
                                <div className="text-xs text-[#6B7280] mt-1">
                                  {stat.label} · {stat.percent}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className={`text-center py-6 ${cardClass}`}>
                  <p className="text-[#6B7280] mb-3 text-sm">想了解今天的运势？</p>
                  <Link href="/daily">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[13px] px-[38px] py-[14px] rounded-2xl border border-[#1C1A16]/15 text-[#1C1A16] bg-white hover:bg-[#1C1A16]/5"
                    >
                      📅 查看每日运势
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </Card>

                <div className="text-center text-xs text-[#6B7280] p-3 bg-white rounded-lg border border-[#1C1A16]/10">
                  ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。命运掌握在自己手中，请理性对待。
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {showQuotaModal && <QuotaLimitModal onClose={() => setShowQuotaModal(false)} />}

      {/* 版本标记 */}
      <div className="hidden" data-version="20260402-v2"></div>
    </div>
  );
}

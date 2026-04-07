'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
} from 'lucide-react';
import { saveBirthInfo, loadBirthInfo } from '@/lib/utils/storage';
import { saveRecord, getRecordById } from '@/lib/utils/history';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingChart } from '@/components/bazi/WuxingChart';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { Container } from '@/components/ui/Container';
import { CitySearch } from '@/components/ui/CitySearch';
import { Tag } from '@/components/ui/Tag';
import {
  DAYMASTER_TRAITS,
  DIZHI_LIST,
  TIANGAN_LIST,
  WUXING_KEYS,
  getCurrentDayun,
  getYearGanzhi,
} from '@/lib/bazi';
import type {
  BaziApiResult,
  BaziHistoryRecord,
  Gender,
  WuxingCount,
  WuXing,
} from '@/lib/bazi/types';

type ResultTab = '性格特质' | '事业财运' | '婚姻健康' | '大运流年';
type AiSectionKey = 'dayMaster' | 'personality' | 'career' | 'wealth' | 'relationship' | 'health';

type TagVariant = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

interface DayunTimelineItem {
  key: string;
  gan: string;
  zhi: string;
  wuxing: WuXing;
  ageStart: number;
  ageEnd: number;
  isCurrent: boolean;
}

interface TabContent {
  scores: Array<{ label: string; value: number }>;
  points: string[];
  detail: string;
}

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

const resultTabs: ResultTab[] = ['性格特质', '事业财运', '婚姻健康', '大运流年'];

const aiSectionTitleMap: Record<AiSectionKey, string> = {
  dayMaster: '日主分析',
  personality: '性格特点',
  career: '事业运势',
  wealth: '财运分析',
  relationship: '感情运势',
  health: '健康提示',
};

const wuxingDisplay: Array<{ key: keyof WuxingCount; label: WuXing; variant: TagVariant }> = [
  { key: 'metal', label: '金', variant: 'metal' },
  { key: 'wood', label: '木', variant: 'wood' },
  { key: 'water', label: '水', variant: 'water' },
  { key: 'fire', label: '火', variant: 'fire' },
  { key: 'earth', label: '土', variant: 'earth' },
];

const scoreColors = ['#1C1A16', '#3B82F6', '#10B981', '#F59E0B'];

const infoBlockClass = 'rounded-2xl border border-[#1C1A16]/10 bg-white p-5 sm:p-6';

function parseSection(text: string, title: string): string {
  const match = new RegExp(`【${title}】([\\s\\S]*?)(?:\\n\\n【|$)`).exec(text);
  return match ? match[1].trim() : '';
}

function extractAiSections(aiAnalysis: string): Record<AiSectionKey, string> {
  return {
    dayMaster: parseSection(aiAnalysis, aiSectionTitleMap.dayMaster),
    personality: parseSection(aiAnalysis, aiSectionTitleMap.personality),
    career: parseSection(aiAnalysis, aiSectionTitleMap.career),
    wealth: parseSection(aiAnalysis, aiSectionTitleMap.wealth),
    relationship: parseSection(aiAnalysis, aiSectionTitleMap.relationship),
    health: parseSection(aiAnalysis, aiSectionTitleMap.health),
  };
}

function firstSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const sentences = trimmed
    .split(/[。！？\n]/)
    .map(chunk => chunk.trim())
    .filter(Boolean);
  if (!sentences.length) return trimmed;
  return `${sentences[0]}。`;
}

function buildPoints(sourceText: string, fallback: string): string[] {
  const pieces = sourceText
    .replace(/[\t\r]/g, ' ')
    .split(/[。！？\n]/)
    .map(line => line.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean);

  const selected = (pieces.length ? pieces : [fallback]).slice(0, 5);
  while (selected.length < 3) {
    selected.push(fallback);
  }

  const prefixes = ['✓', '⚠', '💡', '✓', '💡'];
  return selected.map((item, index) => `${prefixes[index]} ${item}`);
}

function getAge(birthDate: string): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  const dayDiff = now.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(0, age);
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDayunTimeline(birthDate: string, genderValue: string): DayunTimelineItem[] {
  if (!birthDate) return [];

  const gender: Gender = genderValue === 'female' ? 'female' : 'male';
  const current = getCurrentDayun(birthDate, gender);
  const currentGanIndex = TIANGAN_LIST.indexOf(current.gan);
  const currentZhiIndex = DIZHI_LIST.indexOf(current.zhi);

  if (currentGanIndex < 0 || currentZhiIndex < 0) return [];

  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  if (!birthYear || !birthMonth || !birthDay) return [];

  const startAge = 3 + ((birthMonth + birthDay) % 3);
  const age = getAge(birthDate);
  const currentRangeStart = age < startAge ? startAge : startAge + Math.floor((age - startAge) / 10) * 10;

  return [-2, -1, 0, 1, 2].map(offset => {
    const gan = TIANGAN_LIST[(currentGanIndex + offset + 100) % 10];
    const zhi = DIZHI_LIST[(currentZhiIndex + offset + 120) % 12];
    const ageStart = Math.max(0, currentRangeStart + offset * 10);

    return {
      key: `${gan}${zhi}_${ageStart}`,
      gan,
      zhi,
      wuxing: WUXING_KEYS[TIANGAN_LIST[(currentGanIndex + offset + 100) % 10] as WuXing] ? current.wuxing : current.wuxing,
      ageStart,
      ageEnd: ageStart + 9,
      isCurrent: offset === 0,
    };
  });
}

function buildDayunDetail(
  item: DayunTimelineItem | null,
  aiSections: Record<AiSectionKey, string>,
  birthDate: string
): string {
  if (!item) return '暂无大运信息';

  const age = getAge(birthDate);
  const phaseText = item.isCurrent
    ? '当前正在经历该阶段。'
    : age < item.ageStart
      ? '这是未来阶段，可提前布局。'
      : '这是已走过阶段，可用于复盘成长轨迹。';

  const yearGanzhi = getYearGanzhi(getDateString(new Date()));
  const careerBrief = firstSentence(`${aiSections.career} ${aiSections.wealth}`) || '关注节奏与资金管理。';
  const relationBrief = firstSentence(`${aiSections.relationship} ${aiSections.health}`) || '保持稳定作息与关系沟通。';

  return [
    `${item.gan}${item.zhi}大运（${item.ageStart}-${item.ageEnd}岁）。${phaseText}`,
    `当前流年：${yearGanzhi}。`,
    `事业财运：${careerBrief}`,
    `婚姻健康：${relationBrief}`,
  ].join('\n');
}

function scoreValue(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function BaziPageContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('record');

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
    birthPlace: '',
  });
  const [loading, setLoading] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>('性格特质');
  const [tabExpanded, setTabExpanded] = useState<Record<ResultTab, boolean>>({
    性格特质: false,
    事业财运: false,
    婚姻健康: false,
    大运流年: false,
  });
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(2);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziApiResult | null>(null);
  const [actionMessage, setActionMessage] = useState('');

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
        } catch (loadError) {
          console.error('Failed to load birth info:', loadError);
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

    if (status !== 'loading' && !recordId) {
      loadUserBirthInfo();
    }
  }, [status, recordId]);

  useEffect(() => {
    if (!recordId) return;

    const record = getRecordById(recordId);
    if (!record) {
      setError('未找到对应历史记录，请返回历史页重新选择。');
      return;
    }

    setFormData(prev => ({
      ...prev,
      name: record.name || '',
      gender: record.gender || '',
      birthDate: record.birthDate,
      birthHour: record.birthHour,
      birthPlace: record.birthPlace || '',
    }));

    setResult({
      pillars: record.pillars,
      wuxing: record.wuxing,
      aiAnalysis: record.aiAnalysis,
      fiveDimensions: record.fiveDimensions,
      birthPlace: record.birthPlace,
      _source: 'history',
    });

    setActiveTab('性格特质');
    setError('');
    setActionMessage('已加载历史命盘记录');
  }, [recordId]);

  const aiSections = useMemo(() => extractAiSections(result?.aiAnalysis || ''), [result?.aiAnalysis]);

  const personalityText = useMemo(() => {
    return aiSections.personality || firstSentence(result?.aiAnalysis || '') || 'AI 正在准备性格概括，请稍后重试。';
  }, [aiSections.personality, result?.aiAnalysis]);

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
    if (delta >= 1) level = '偏旺';
    if (delta <= -1) level = '偏弱';

    const sortedElements = wuxingDisplay
      .map(({ key, label }) => ({ label, value: result.wuxing[key] }))
      .sort((a, b) => a.value - b.value);

    return {
      title: `${dayPillar.gan}${dayPillar.ganWuxing}`,
      ganZhi: `${dayPillar.gan}${dayPillar.zhi}`,
      level,
      trait: DAYMASTER_TRAITS[dayPillar.gan] || '',
      personalityBrief: firstSentence(personalityText),
      favorable: sortedElements.slice(0, 2).map(item => item.label).join('、'),
      avoid: sortedElements.slice(-2).map(item => item.label).join('、'),
      detail: `日主${level}（${dayValue.toFixed(1)} vs 均值 ${average.toFixed(1)}）`,
    };
  }, [result, personalityText]);

  const dayunTimeline = useMemo(
    () => buildDayunTimeline(formData.birthDate, formData.gender),
    [formData.birthDate, formData.gender]
  );

  useEffect(() => {
    if (!dayunTimeline.length) {
      setSelectedDayunIndex(0);
      return;
    }
    const currentIndex = dayunTimeline.findIndex(item => item.isCurrent);
    setSelectedDayunIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [dayunTimeline]);

  const selectedDayun = dayunTimeline[selectedDayunIndex] ?? null;

  const dayunDetail = useMemo(() => {
    return buildDayunDetail(selectedDayun, aiSections, formData.birthDate);
  }, [selectedDayun, aiSections, formData.birthDate]);

  const tabContent = useMemo<Record<ResultTab, TabContent>>(() => {
    const dimensions = result?.fiveDimensions;
    const careerScore = dimensions ? scoreValue((dimensions.career + dimensions.wealth) / 2) : 0;
    const relationScore = dimensions ? scoreValue((dimensions.relationship + dimensions.health) / 2) : 0;
    const personalityScore = dimensions ? scoreValue((dimensions.studies + dimensions.health) / 2) : 0;

    return {
      性格特质: {
        scores: dimensions
          ? [
              { label: '性格稳定度', value: personalityScore },
              { label: '学习成长', value: scoreValue(dimensions.studies) },
            ]
          : [],
        points: buildPoints(aiSections.personality || aiSections.dayMaster, '保持稳定节奏，持续优化自我表达'),
        detail: aiSections.personality || aiSections.dayMaster || result?.aiAnalysis || '暂无详细解读。',
      },
      事业财运: {
        scores: dimensions
          ? [
              { label: '事业', value: scoreValue(dimensions.career) },
              { label: '财运', value: scoreValue(dimensions.wealth) },
              { label: '综合', value: careerScore },
            ]
          : [],
        points: buildPoints(`${aiSections.career}\n${aiSections.wealth}`, '稳健行动，先做确定性更高的选择'),
        detail: `${aiSections.career || '暂无事业解读。'}\n\n${aiSections.wealth || '暂无财运解读。'}`,
      },
      婚姻健康: {
        scores: dimensions
          ? [
              { label: '关系', value: scoreValue(dimensions.relationship) },
              { label: '健康', value: scoreValue(dimensions.health) },
              { label: '综合', value: relationScore },
            ]
          : [],
        points: buildPoints(`${aiSections.relationship}\n${aiSections.health}`, '关注沟通质量与作息管理，减少内耗'),
        detail: `${aiSections.relationship || '暂无婚姻关系解读。'}\n\n${aiSections.health || '暂无健康解读。'}`,
      },
      大运流年: {
        scores: dimensions
          ? [
              { label: '阶段节奏', value: scoreValue((dimensions.career + dimensions.relationship) / 2) },
            ]
          : [],
        points: buildPoints(dayunDetail, '以十年为周期制定目标，按年度滚动调整'),
        detail: dayunDetail,
      },
    };
  }, [aiSections, dayunDetail, result]);

  const activeTabContent = tabContent[activeTab];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setActionMessage('');

    if (!formData.birthDate) {
      setError('请选择出生日期');
      return;
    }
    if (!formData.birthHour) {
      setError('请选择出生时辰');
      return;
    }

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
          body: JSON.stringify({
            name: formData.name,
            birthDate: formData.birthDate,
            birthHour: formData.birthHour,
            gender: formData.gender,
          }),
        });
      } catch (saveError) {
        console.error('Failed to save birth info:', saveError);
      }
    }

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour, 10),
          birthPlace: formData.birthPlace,
        }),
      });

      const data = (await response.json()) as BaziApiResult & { error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth/login?redirect=/bazi';
          return;
        }
        if (data.error === 'QUOTA_EXCEEDED') {
          setShowQuotaModal(true);
          return;
        }
        throw new Error(data.error || '服务器错误，请稍后重试');
      }

      setResult(data);
      setActiveTab('性格特质');
      setTabExpanded({
        性格特质: false,
        事业财运: false,
        婚姻健康: false,
        大运流年: false,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentRecord = () => {
    if (!result || !dayMasterInsight) return;

    const toSave: Omit<BaziHistoryRecord, 'id' | 'createdAt'> = {
      name: formData.name || '缘主',
      gender: formData.gender || 'unknown',
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      birthPlace: formData.birthPlace,
      dayMaster: dayMasterInsight.title,
      aiSummary: firstSentence(personalityText) || '已保存命盘记录。',
      aiAnalysis: result.aiAnalysis,
      pillars: result.pillars,
      wuxing: result.wuxing,
      fiveDimensions: result.fiveDimensions,
    };

    const saved = saveRecord(toSave);
    setActionMessage(saved ? '命盘已保存到历史记录（最多保留3条）' : '保存失败，请重试');
  };

  const handleSharePlaceholder = () => {
    setActionMessage('分享功能开发中，敬请期待。');
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setActionMessage('已重置结果，请重新测算');
    setActiveTab('性格特质');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('record');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const inputClass =
    'w-full h-10 rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all';
  const cardClass =
    'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white hover:shadow-card-hover transition-shadow duration-300';

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="text-center pt-10 md:pt-12 pb-8">
        <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>
          八字分析
        </h1>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">输入您的出生信息，AI 将为您解读命盘</p>
      </div>

      <Container>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20 md:pb-26">
          <div className="bazi-input-card flex-shrink-0 w-full lg:w-auto lg:max-w-[440px] rounded-2xl bg-white shadow-none px-6 py-8 sm:px-8 border border-[#1C1A16]/8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display text-lg text-[#1C1A16]">📋 出生信息</h2>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]">姓名</label>
                <input
                  type="text"
                  placeholder="输入您的姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1C1A16]">性别</label>
                <SegmentControl
                  options={[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                  value={formData.gender}
                  onChange={(value) => setFormData({ ...formData, gender: value })}
                  className="h-10 rounded-lg border border-[#1C1A16]/15 bg-white text-[#1C1A16] overflow-hidden"
                  optionClassName="px-3 py-0 h-full flex items-center justify-center text-sm"
                />
              </div>

              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="h-10 rounded-lg"
              />

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

              {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

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

          <div className="flex-1 min-w-0">
            {loading && (
              <Card className={`flex flex-col items-center justify-center py-16 ${cardClass}`}>
                <BaguaSpinner size={64} />
                <p className="mt-4 text-[#1C1A16] font-medium">正在计算您的命盘...</p>
                <p className="text-sm text-[#6B7280] mt-2">AI 正在解读中，请稍候</p>
              </Card>
            )}

            {!result && !loading && (
              <Card className={`flex flex-col items-center justify-center py-20 text-center ${cardClass}`}>
                <div className="w-16 h-16 rounded-full bg-[#F2EEE6] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[#1C1A16] font-medium text-lg">填写信息后点击开始分析</p>
                <p className="text-sm text-[#6B7280] mt-2">AI 将为您生成专属命盘解读</p>
              </Card>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-fadeIn">
                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">A 区 · 命盘核心</h2>

                  <div className="space-y-4">
                    <div className={infoBlockClass}>
                      <BaziChart pillars={result.pillars} />
                    </div>

                    <div className={infoBlockClass}>
                      <WuxingChart wuxing={result.wuxing} />
                      <div className="mt-5 flex flex-wrap gap-2.5">
                        {wuxingDisplay.map(({ key, label, variant }) => (
                          <Tag key={key} variant={variant} className="text-xs px-3 py-1.5">
                            {label} {result.wuxing[key]}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    {dayMasterInsight && (
                      <div className="rounded-2xl border border-[#1C1A16]/15 bg-gradient-to-r from-[#FFF6E8] via-[#FFFDF7] to-[#F6F0E4] p-5 sm:p-6">
                        <p className="text-xs font-medium text-[#1C1A16]/60 mb-2">日主摘要卡</p>
                        <p className="text-2xl font-bold text-[#1C1A16]">你是{dayMasterInsight.title}命人</p>
                        <p className="text-sm text-[#1C1A16]/80 mt-2">日主干支：{dayMasterInsight.ganZhi}</p>
                        <p className="text-sm text-[#1C1A16]/80 mt-1">AI 人格概括：{dayMasterInsight.personalityBrief}</p>
                        <p className="text-sm text-[#1C1A16]/80 mt-1">
                          喜用神建议：宜补 {dayMasterInsight.favorable}，少耗 {dayMasterInsight.avoid}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-2">{dayMasterInsight.detail}</p>
                        {dayMasterInsight.trait && (
                          <p className="text-xs text-[#6B7280] mt-1">{dayMasterInsight.trait}</p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">B 区 · AI 解读</h2>

                  <SegmentControl
                    options={resultTabs.map(tab => ({ value: tab, label: tab }))}
                    value={activeTab}
                    onChange={(value) => setActiveTab(value as ResultTab)}
                    className="w-full h-11 border border-[#1C1A16]/15"
                    optionClassName="text-[13px]"
                  />

                  <div className="mt-5 space-y-5">
                    {activeTab === '大运流年' && (
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4 sm:p-5">
                        <p className="text-sm font-medium text-[#1C1A16] mb-3">大运时间轴</p>
                        <div className="overflow-x-auto">
                          <div className="flex gap-3 snap-x snap-mandatory pb-1">
                            {dayunTimeline.map((item, index) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setSelectedDayunIndex(index)}
                                className={`min-w-[160px] snap-start rounded-xl border p-3 text-left transition-colors ${
                                  index === selectedDayunIndex
                                    ? 'border-[#1C1A16] bg-[#1C1A16] text-white'
                                    : item.isCurrent
                                      ? 'border-[#1C1A16]/40 bg-[#FFF6E8] text-[#1C1A16]'
                                      : 'border-[#1C1A16]/12 bg-white text-[#1C1A16]'
                                }`}
                              >
                                <p className="text-lg font-semibold tracking-[0.08em]">{item.gan}{item.zhi}</p>
                                <p className="text-xs mt-1 opacity-80">{item.ageStart}-{item.ageEnd} 岁</p>
                                {item.isCurrent && <p className="text-[11px] mt-1">当前大运</p>}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                      <p className="text-sm font-medium text-[#1C1A16] mb-3">评分概览</p>
                      {activeTabContent.scores.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {activeTabContent.scores.map((score, index) => (
                            <div
                              key={score.label}
                              className="rounded-xl border border-[#1C1A16]/10 p-3"
                              style={{ backgroundColor: `${scoreColors[index % scoreColors.length]}08` }}
                            >
                              <p className="text-xs text-[#1C1A16]/70">{score.label}</p>
                              <p className="text-xl font-bold text-[#1C1A16] mt-1">{score.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#6B7280]">当前数据暂无可量化分数。</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                      <p className="text-sm font-medium text-[#1C1A16] mb-3">AI 要点</p>
                      <ul className="space-y-2">
                        {activeTabContent.points.map((point, index) => (
                          <li key={`${point}_${index}`} className="text-sm text-[#1C1A16]/85 leading-relaxed">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between text-left"
                        onClick={() =>
                          setTabExpanded(prev => ({
                            ...prev,
                            [activeTab]: !prev[activeTab],
                          }))
                        }
                      >
                        <span className="text-sm font-medium text-[#1C1A16]">详细解读</span>
                        {tabExpanded[activeTab] ? (
                          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                        )}
                      </button>

                      {tabExpanded[activeTab] && (
                        <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/80 whitespace-pre-wrap">
                          {activeTabContent.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">C 区 · 操作引导</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSaveCurrentRecord}
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存命盘
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSharePlaceholder}
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      分享结果
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新测算
                    </Button>
                    <Link href="/history" className="w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-center border border-[#1C1A16]/20 bg-transparent text-[#1C1A16] hover:bg-[#1C1A16]/5"
                      >
                        <History className="w-4 h-4 mr-2" />
                        查看历史
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                  {actionMessage && <p className="mt-3 text-sm text-[#6B7280]">{actionMessage}</p>}
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

      <div className="hidden" data-version="20260407-v3"></div>
    </div>
  );
}

export default function BaziPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><BaguaSpinner size={48} /></div>}>
      <BaziPageContent />
    </Suspense>
  );
}

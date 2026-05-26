'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
import { deleteRecord, getRecordById, saveRecord } from '@/lib/utils/history';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { Container } from '@/components/ui/Container';
import { CitySearch } from '@/components/ui/CitySearch';
import { Tag } from '@/components/ui/Tag';
import { Footer } from '@/components/layout/Footer';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import {
  DAYMASTER_TRAITS,
  DIZHI_LIST,
  TIANGAN_LIST,
  TIANGAN_WUXING,
  WUXING_KEYS,
  getCurrentDayun,
  getDayunTimeline,
  getLunarDate,
  getYearGanzhi,
} from '@/lib/bazi';
import type {
  BaziApiResult,
  BaziHistoryRecord,
  DayunTimelineItem,
  Gender,
  MingGeInfo,
  WuxingCount,
  WuXing,
} from '@/lib/bazi/types';

const _loadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
  </div>
);

const BasicInfoCard = dynamic(() => import('@/components/bazi/BasicInfoCard').then(m => m.BasicInfoCard), { ssr: false, loading: _loadingSpinner });
const BaziChart = dynamic(() => import('@/components/bazi/BaziChart').then(m => m.BaziChart), { ssr: false, loading: _loadingSpinner });
const DayMasterSummaryCard = dynamic(() => import('@/components/bazi/DayMasterSummaryCard').then(m => m.DayMasterSummaryCard), { ssr: false, loading: _loadingSpinner });
const ShareCard = dynamic(() => import('@/components/bazi/ShareCard').then(m => m.ShareCard), { ssr: false, loading: _loadingSpinner });
const ShishenDetailTab = dynamic(() => import('@/components/bazi/ShishenDetailTab').then(m => m.ShishenDetailTab), { ssr: false, loading: _loadingSpinner });
const WuxingChart = dynamic(() => import('@/components/bazi/WuxingChart').then(m => m.WuxingChart), { ssr: false, loading: _loadingSpinner });

type ResultTab = '性格特质' | '事业财运' | '婚姻健康' | '十神详解' | '大运流年';
type AiSectionKey = 'dayMaster' | 'personality' | 'career' | 'wealth' | 'relationship' | 'health' | 'dayun';

type TagVariant = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

interface TabContent {
  scores: Array<{ label: string; value: number }>;
  points: string[];
  detail: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

type BaziPageResult = BaziApiResult & {
  dayMasterElement?: WuXing;
  lunarDate?: string;
  zodiac?: string;
  trueSolarOffsetMinutes?: number | null;
  trueSolarCorrection?: string;
  trueSolarTime?: string;
  dayunStartDescription?: string;
  dayunStartAt?: string;
};

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

const resultTabs: ResultTab[] = ['性格特质', '事业财运', '婚姻健康', '十神详解', '大运流年'];

// 移动端简短标签映射
const mobileTabLabels: Record<ResultTab, string> = {
  '性格特质': '性格',
  '事业财运': '事业',
  '婚姻健康': '婚姻',
  '十神详解': '十神',
  '大运流年': '大运',
};

const aiSectionTitleMap: Record<AiSectionKey, string[]> = {
  dayMaster: ['日主分析'],
  personality: ['性格特点', '性格特质'],
  career: ['事业运势', '事业分析'],
  wealth: ['财运分析', '财富分析'],
  relationship: ['感情运势', '婚姻分析'],
  health: ['健康提示', '健康分析'],
  dayun: ['大运流年', '流年趋势'],
};

const wuxingDisplay: Array<{ key: keyof WuxingCount; label: WuXing; variant: TagVariant }> = [
  { key: 'metal', label: '金', variant: 'metal' },
  { key: 'wood', label: '木', variant: 'wood' },
  { key: 'water', label: '水', variant: 'water' },
  { key: 'fire', label: '火', variant: 'fire' },
  { key: 'earth', label: '土', variant: 'earth' },
];

const faqItems: FaqItem[] = [
  {
    question: '八字分析结果会一直保存吗？',
    answer: '本地历史默认最多保留 3 条新记录，超过后会自动覆盖最旧记录。建议及时查看并补充自己的行动计划。',
  },
  {
    question: '同一天出生的人，结果一定一样吗？',
    answer: '不会。出生时辰、出生地、性别与解读模型的综合分析都会影响结果展示，细节差异会较大。',
  },
  {
    question: '"喜用神"和"忌神"可以怎么用？',
    answer: '可以把喜用神理解为更适合补强的能量方向，忌神理解为需要控制投入的方向，用于日常决策优先级排序。',
  },
  {
    question: '大运流年怎么看更实用？',
    answer: '建议用十年看战略、按年度看节奏。先关注当前阶段重点，再拆分到季度和月度动作，避免一次性做太多重大决策。',
  },
  {
    question: '结果和现实冲突时该怎么处理？',
    answer: '优先以现实数据和专业建议为准。命理内容适合作为自我观察与复盘参考，不建议直接替代医疗、法律或投资判断。',
  },
];

function parseSection(text: string, titles: string[]): string {
  for (const title of titles) {
    const match = new RegExp(`【${title}】([\\s\\S]*?)(?:\\n\\n【|$)`).exec(text);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
}

function extractAiSections(aiAnalysis: string): Record<AiSectionKey, string> {
  return {
    dayMaster: parseSection(aiAnalysis, aiSectionTitleMap.dayMaster),
    personality: parseSection(aiAnalysis, aiSectionTitleMap.personality),
    career: parseSection(aiAnalysis, aiSectionTitleMap.career),
    wealth: parseSection(aiAnalysis, aiSectionTitleMap.wealth),
    relationship: parseSection(aiAnalysis, aiSectionTitleMap.relationship),
    health: parseSection(aiAnalysis, aiSectionTitleMap.health),
    dayun: parseSection(aiAnalysis, aiSectionTitleMap.dayun),
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

function toGenderLabel(gender: string): string {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return '未填写';
}

function toHourLabel(hourValue: string): string {
  return shichenOptions.find(option => option.value === hourValue)?.label || '未知时辰';
}

function buildBaziText(result: BaziPageResult): string {
  return [
    `${result.pillars.year.gan}${result.pillars.year.zhi}`,
    `${result.pillars.month.gan}${result.pillars.month.zhi}`,
    `${result.pillars.day.gan}${result.pillars.day.zhi}`,
    `${result.pillars.hour.gan}${result.pillars.hour.zhi}`,
  ].join(' ');
}

function getZodiacByBirthDate(birthDate: string): string {
  const year = Number(birthDate.split('-')[0]);
  if (!year) return '未提供';
  const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return zodiac[(year - 4 + 1200) % 12] || '未提供';
}

function getDayunStartFallback(birthDate: string): { description: string; at: string } {
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  if (!birthYear || !birthMonth || !birthDay) {
    return { description: '待计算', at: '—' };
  }
  const startAge = 3 + ((birthMonth + birthDay) % 3);
  return {
    description: `约 ${startAge} 岁起运`,
    at: `约 ${birthYear + startAge} 年`,
  };
}

function getScoreStyle(score: number): { barClass: string; textClass: string } {
  if (score >= 80) return { barClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
  if (score >= 60) return { barClass: 'bg-amber-500', textClass: 'text-amber-600' };
  return { barClass: 'bg-rose-500', textClass: 'text-rose-600' };
}

function buildDayunTimeline(birthDate: string, genderValue: string): Array<DayunTimelineItem & { key: string }> {
  if (!birthDate) return [];

  const gender: Gender = genderValue === 'female' ? 'female' : 'male';
  const timeline = getDayunTimeline(birthDate, gender);

  return timeline.map(item => ({
    ...item,
    key: `${item.gan}${item.zhi}_${item.ageStart}`,
  }));
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
  const dayunBrief = firstSentence(aiSections.dayun) || '结合十年节奏与年度变化，滚动复盘。';

  return [
    `${item.gan}${item.zhi}大运（${item.ageStart}-${item.ageEnd}岁）。${phaseText}`,
    `当前流年：${yearGanzhi}。`,
    `阶段提示：${dayunBrief}`,
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
  const resultRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
    birthPlace: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingLong, setLoadingLong] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>('性格特质');
  const [tabExpanded, setTabExpanded] = useState<Record<ResultTab, boolean>>({
    性格特质: true,
    事业财运: true,
    婚姻健康: true,
    十神详解: true,
    大运流年: true,
  });
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(2);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziPageResult | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isMember, setIsMember] = useState(false);

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
      } catch (quotaError) {
        console.error('Failed to load user quota:', quotaError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

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
      dayMasterElement: record.dayMasterElement,
      lunarDate: record.lunarDate,
      zodiac: record.zodiac,
      trueSolarOffsetMinutes: record.trueSolarOffsetMinutes,
      dayunStartDescription: record.dayunStartDescription,
      dayunStartAt: record.dayunStartAt,
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

    const favorableGods = sortedElements.slice(0, 2).map(item => item.label);
    const avoidGods = sortedElements.slice(-2).map(item => item.label);
    const trait = DAYMASTER_TRAITS[dayPillar.gan] || '';
    const personalityBrief = firstSentence(personalityText);
    const corePersonality = trait ? `${personalityBrief} ${trait}` : personalityBrief;

    return {
      title: `${dayPillar.gan}${dayPillar.ganWuxing}`,
      ganZhi: `${dayPillar.gan}${dayPillar.zhi}`,
      personality: `${corePersonality} 日主${level}（${dayValue.toFixed(1)} vs 均值 ${average.toFixed(1)}）。`,
      favorableGods,
      avoidGods,
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

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      setLoadingLong(false);
      timer = setTimeout(() => setLoadingLong(true), 8000);
    } else {
      setLoadingLong(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const dayunDetail = useMemo(() => {
    return buildDayunDetail(selectedDayun, aiSections, formData.birthDate);
  }, [selectedDayun, aiSections, formData.birthDate]);

  const basicInfoData = useMemo(() => {
    if (!result) return null;

    const dayunFallback = getDayunStartFallback(formData.birthDate);

    const lunarDate = formData.birthDate
      ? getLunarDate(formData.birthDate)
      : '未提供';

    return {
      baziText: buildBaziText(result),
      name: formData.name || '缘主',
      gender: toGenderLabel(formData.gender),
      birthTime: `${formData.birthDate || '未填写'} ${toHourLabel(formData.birthHour)}`,
      lunarDate,
      zodiac: result.zodiac || getZodiacByBirthDate(formData.birthDate),
      dayunStartDescription: result.dayunStartDescription || dayunFallback.description,
      dayunStartAt: result.dayunStartAt || dayunFallback.at,
    };
  }, [formData.birthDate, formData.birthHour, formData.gender, formData.name, result]);

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
      十神详解: {
        scores: [],
        points: [],
        detail: '十神详解通过独立组件渲染，不使用通用模板。',
      },
      大运流年: {
        scores: dimensions
          ? [
              { label: '阶段节奏', value: scoreValue((dimensions.career + dimensions.relationship) / 2) },
            ]
          : [],
        points: buildPoints(`${aiSections.dayun}\n${dayunDetail}`, '以十年为周期制定目标，按年度滚动调整'),
        detail: `${aiSections.dayun || '暂无大运流年专项解读。'}\n\n${dayunDetail}`,
      },
    };
  }, [aiSections, dayunDetail, result]);

  const activeTabContent = tabContent[activeTab];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setActionMessage('');

    if (!formData.gender) {
      setError('请选择性别');
      return;
    }
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

      // 自动保存到历史记录
      try {
        const autoSave = {
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: formData.birthHour,
          birthPlace: formData.birthPlace,
          dayMaster: data.pillars?.day?.gan || '',
          aiSummary: (data.aiAnalysis || '').split(/[。！？]/)[0] || '已保存命盘记录。',
          aiAnalysis: data.aiAnalysis || '',
          pillars: data.pillars,
          wuxing: data.wuxing,
          fiveDimensions: data.fiveDimensions,
          dayMasterElement: data.pillars?.day?.ganWuxing,
          lunarDate: data.lunarDate,
          zodiac: data.zodiac,
          trueSolarOffsetMinutes: data.trueSolarOffsetMinutes ?? null,
          dayunStartDescription: data.dayunStartDescription,
          dayunStartAt: data.dayunStartAt,
        };
        saveRecord(autoSave);
      } catch(e) { console.error('auto save failed', e); }

      setActiveTab('性格特质');
      setTabExpanded({
        性格特质: false,
        事业财运: false,
        婚姻健康: false,
        十神详解: false,
        大运流年: false,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentRecord = () => {
    if (!result || !dayMasterInsight || !basicInfoData) return;

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
      dayMasterElement: result.pillars.day.ganWuxing,
      lunarDate: basicInfoData.lunarDate,
      zodiac: basicInfoData.zodiac,
      trueSolarOffsetMinutes: result.trueSolarOffsetMinutes ?? null,
      dayunStartDescription: basicInfoData.dayunStartDescription,
      dayunStartAt: basicInfoData.dayunStartAt,
    };

    const saved = saveRecord(toSave);
    setActionMessage(saved ? '命盘已保存到历史记录（最多保留3条）' : '保存失败，请重试');
  };

  const handleSharePlaceholder = () => {
    setActionMessage('分享功能开发中，敬请期待。');
  };

  const clearResultState = (message: string) => {
    setResult(null);
    setError('');
    setActionMessage(message);
    setActiveTab('性格特质');
    setTabExpanded({
      性格特质: false,
      事业财运: false,
      婚姻健康: false,
      十神详解: false,
      大运流年: false,
    });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('record');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleReset = () => {
    clearResultState('已重置结果，请重新测算');
  };

  const handleEditBasicInfo = () => {
    setActionMessage('请在左侧表单修改信息后重新测算。');
    if (typeof window !== 'undefined') {
      const formCard = document.querySelector('.bazi-input-card');
      formCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteBasicInfo = () => {
    let message = '已清空当前结果。';
    if (recordId) {
      const deleted = deleteRecord(recordId);
      message = deleted ? '已删除该历史记录并清空结果。' : '已清空结果（历史记录不存在或删除失败）。';
    }
    clearResultState(message);
  };

  const inputClass =
    'w-full h-10 rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all';
  const cardClass =
    'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white hover:shadow-card-hover transition-shadow duration-300';

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="text-center pt-6 md:pt-12 pb-8">
        <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>
          八字分析
        </h1>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">输入您的出生信息，AI 将为您解读命盘</p>
      </div>

      <Container>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20 md:pb-26">
          <div className="bazi-input-card flex-shrink-0 w-full lg:w-auto lg:max-w-[440px] rounded-2xl bg-white shadow-none px-6 py-6 sm:px-8 sm:py-8 border border-[#1C1A16]/8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 基本信息组 */}
              <fieldset className="space-y-5 rounded-xl bg-[#FAF9F6] p-5 border border-[#1C1A16]/6">
                <legend className="font-display text-base text-[#1C1A16]/85 px-2 tracking-wide">📋 基本信息</legend>

                <div className="space-y-1.5">
                  <label htmlFor="bazi-name" className="block text-sm font-medium text-[#1C1A16]/70">姓名</label>
                  <input
                    id="bazi-name"
                    type="text"
                    placeholder="请输入姓名"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1C1A16]/70">性别</label>
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
              </fieldset>

              {/* 时辰组 */}
              <fieldset className="space-y-5 rounded-xl bg-[#FAF9F6] p-5 border border-[#1C1A16]/6">
                <legend className="font-display text-base text-[#1C1A16]/85 px-2 tracking-wide">🕐 时辰信息</legend>

                <div className="space-y-1.5">
                  <label htmlFor="bazi-birth-hour" className="block text-sm font-medium text-[#1C1A16]/70">出生时辰</label>
                  <Select
                    id="bazi-birth-hour"
                    options={shichenOptions}
                    value={formData.birthHour}
                    onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                    className="h-10 rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16]"
                  />
                </div>

                <CitySearch
                  label="出生地"
                  placeholder="如 北京市、上海市"
                  value={formData.birthPlace}
                  onInputChange={(value) => setFormData(prev => ({ ...prev, birthPlace: value }))}
                  onSelect={(city) => setFormData(prev => ({ ...prev, birthPlace: city.name }))}
                />
              </fieldset>

              {error && <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

              <Button
                type="submit"
                variant="ghost"
                loading={loading}
                className="w-full text-[13px] px-[38px] py-[12px] rounded-xl border border-[#1C1A16]/30 text-[#1C1A16] bg-transparent hover:bg-[#1C1A16]/5"
              >
                {loading ? '正在计算...' : '开始解读'}
              </Button>
            </form>
          </div>

          <div className="flex-1 min-w-0">
            {loading && (
              <Card className={`flex flex-col items-center justify-center py-16 ${cardClass}`}>
                <BaguaSpinner size={64} />
                <p className="mt-4 text-[#1C1A16] font-medium">正在计算您的命盘...</p>
                <p className="text-sm text-[#6B7280] mt-2">
                  {loadingLong ? 'AI 解读耗时较长，正在为您准备基础解读...' : 'AI 正在解读中，请稍候'}
                </p>
              </Card>
            )}

            {!result && !loading && (
              <Card className={`flex flex-col items-center justify-center py-20 text-center ${cardClass}`}>
                <div className="w-16 h-16 rounded-full bg-[#F2EEE6] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[#1C1A16] font-medium text-lg">开始您的命盘解读</p>
                <p className="text-sm text-[#6B7280] mt-2 max-w-[260px]">填写左侧出生信息，AI 将生成专属八字解读</p>
                <div className="mt-6 text-left bg-[#FAF9F6] rounded-xl p-4 max-w-[300px] w-full">
                  <p className="text-xs font-medium text-[#1C1A16]/60 mb-2">填写提示</p>
                  <ul className="space-y-1.5 text-xs text-[#1C1A16]/55">
                    <li>• 出生日期：如 1990-01-15</li>
                    <li>• 时辰不确定可选"不知道"</li>
                    <li>• 出生地影响真太阳时计算</li>
                  </ul>
                </div>
              </Card>
            )}

            {result && !loading && basicInfoData && dayMasterInsight && (
              <div ref={resultRef} className="space-y-6 animate-fadeIn" aria-live="polite">
                {result._source !== 'history' && !isMember && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-3">
                    <p className="text-sm text-amber-800">✨ 解读已生成！升级会员解锁完整 AI 深度报告</p>
                    <Link href="/pricing" className="shrink-0 text-xs font-medium text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors">
                      了解会员
                    </Link>
                  </div>
                )}
                {result._source === 'fallback' && (
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200/60 px-4 py-3">
                    <span className="text-blue-500 text-lg">ℹ️</span>
                    <p className="text-sm text-blue-700">AI 解读耗时较长，已为您准备基础解读（简化版解读，完整版需会员）</p>
                  </div>
                )}
                <Card className={`${cardClass} p-0`}>
                  <BasicInfoCard
                    baziText={basicInfoData.baziText}
                    name={basicInfoData.name}
                    gender={basicInfoData.gender}
                    birthTime={basicInfoData.birthTime}
                    lunarDate={basicInfoData.lunarDate}
                    zodiac={basicInfoData.zodiac}
                    dayunStartDescription={basicInfoData.dayunStartDescription}
                    dayunStartAt={basicInfoData.dayunStartAt}
                    isAuthenticated={status === 'authenticated'}
                    onEdit={handleEditBasicInfo}
                    onDelete={handleDeleteBasicInfo}
                  />
                </Card>

                <Card className={cardClass}>
                  <BaziChart pillars={result.pillars} />
                </Card>

                <Card className={cardClass}>
                  <WuxingChart wuxing={result.wuxing} dayMasterElement={result.pillars.day.ganWuxing} />
                </Card>

                <Card className={`${cardClass} p-0`}>
                  <DayMasterSummaryCard
                    dayMaster={dayMasterInsight.title}
                    personality={dayMasterInsight.personality}
                    favorableGods={dayMasterInsight.favorableGods}
                    avoidGods={dayMasterInsight.avoidGods}
                    mingGe={result.mingGe}
                  />
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-1">AI 解读</h2>
                  <p className="text-xs text-[#1C1A16]/45 mb-4">AI 命理解读 · 仅供参考</p>
                  <SegmentControl
                    options={resultTabs.map(tab => ({
                      value: tab,
                      label: tab
                    }))}
                    value={activeTab}
                    onChange={(value) => setActiveTab(value as ResultTab)}
                    className="w-full h-11 border border-[#1C1A16]/15"
                    optionClassName="text-[11px] md:text-[13px]"
                  />

                  <div className="mt-5 space-y-5">
                    {activeTab === '十神详解' && (
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                        <ShishenDetailTab pillars={result.pillars} dayGan={result.pillars.day.gan} />
                      </div>
                    )}

                    {activeTab === '大运流年' && (
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4 sm:p-5">
                        <p className="text-sm font-medium text-[#1C1A16] mb-3">大运时间轴</p>
                        {dayunTimeline.length ? (
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
                        ) : (
                          <p className="text-sm text-[#6B7280]">缺少出生信息，暂时无法生成大运时间轴。</p>
                        )}
                      </div>
                    )}

                    {activeTab !== '十神详解' && (
                      <>
                        <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-5">
                          <p className="text-sm font-medium text-[#1C1A16] mb-3">评分概览</p>
                        {activeTabContent.scores.length > 0 ? (
                        <div className="space-y-3">
                          {activeTabContent.scores.map((score) => {
                            const style = getScoreStyle(score.value);
                            return (
                              <div key={score.label} className="rounded-xl border border-[#1C1A16]/10 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-[#1C1A16]/72">{score.label}</p>
                                  <p className={`text-sm font-semibold ${style.textClass}`}>{score.value}</p>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-[#1C1A16]/10 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${style.barClass}`} style={{ width: `${score.value}%` }} />
                                </div>
                              </div>
                            );
                          })}
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
                      </>
                    )}
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">常见问题</h2>
                  <div className="space-y-3">
                    {faqItems.map((item, index) => {
                      const expanded = expandedFaqIndex === index;
                      return (
                        <div key={item.question} className="rounded-2xl border border-[#1C1A16]/10 bg-white px-4 py-3">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-left"
                            onClick={() => setExpandedFaqIndex(prev => (prev === index ? null : index))}
                          >
                            <span className="text-sm font-medium text-[#1C1A16]">{item.question}</span>
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                            )}
                          </button>
                          {expanded && (
                            <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/78">
                              {item.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">操作栏</h2>
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
                      分享
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

                <Card className={cardClass}>
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em] mb-5">分享卡片</h2>
                  <ShareCard
                    pillars={result.pillars}
                    dayMaster={dayMasterInsight.title}
                    zodiac={result.zodiac || '未知'}
                    summary={dayMasterInsight.personality.split('。')[0] + '。'}
                  />
                </Card>

                <AiDisclaimer />
                <div className="text-center text-xs text-[#6B7280] p-3 bg-white rounded-2xl border border-[#1C1A16]/10">
                  ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。命运掌握在自己手中，请理性对待。
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {showQuotaModal && <QuotaLimitModal onClose={() => setShowQuotaModal(false)} />}

      <Footer />

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

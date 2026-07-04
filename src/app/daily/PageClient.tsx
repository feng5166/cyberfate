'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { Footer } from '@/components/layout/Footer';
import { saveBirthInfo, loadBirthInfo, clearBirthInfo } from '@/lib/utils/storage';
import { DatePicker } from '@/components/ui/DatePicker';
import { Sun, Cloud, Droplets, Heart, Briefcase, Activity, Sparkles, ArrowRight, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import DailyMusicCard from '@/components/music-oracle/DailyMusicCard';
import TimelineSection from '@/components/daily/TimelineSection';
import DailyDetailAnalysis from '@/components/daily/DailyDetailAnalysis';
import DailyFortuneQA from '@/components/daily/DailyFortuneQA';
import html2canvas from 'html2canvas';
import { track } from '@/lib/analytics';
import { WUXING } from '@/data/wuxing';

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

interface DailyResult {
  date: string;
  lunarDate: string;
  dayGanzhi: string;
  overall: number;
  headline?: string;
  ratings: {
    career: number;
    wealth: number;
    love: number;
    health: number;
    studies: number;
    social?: number;
  };
  suitable: string[];
  avoid: string[];
  lucky: {
    color: string;
    numbers: number[];
    direction: string;
  };
  advice: string;
  briefing?: string;
  verse?: string;
  imageUrl?: string;
  overallLabel?: string;
  luckyHour?: string;
  ratingComments?: {
    career?: string;
    wealth?: string;
    love?: string;
    health?: string;
    studies?: string;
    social?: string;
  };
  _source?: string;
}


// 命理化评分模板库（6维度×5等级=30条）
const RATING_TEMPLATES: Record<string, Record<string, string>> = {
  career: {
    旺: "官星得力，日主乘势而上",
    强: "官印相生，事业稳步向前",
    平: "日主中和，新事缓推为宜",
    弱: "日主受克，推进多阻",
    衰: "官星受冲，宜守不宜攻"
  },
  wealth: {
    旺: "财星当令，正财偏财皆旺",
    强: "财源稳固，可适度进取",
    平: "财星临平，无横财保稳",
    弱: "财气消耗，不宜投机",
    衰: "比劫夺财，谨防破财"
  },
  love: {
    旺: "桃花得地，姻缘可期",
    强: "夫妻宫顺，旧爱新缘皆宜",
    平: "桃花一般，旧情可续",
    弱: "桃花浮动，多沟通少决断",
    衰: "桃花受克，慎防口舌"
  },
  health: {
    旺: "日元充沛，精力旺盛",
    强: "五行调和，身心皆顺",
    平: "气血平稳，注意作息",
    弱: "日元偏弱，宜静养",
    衰: "五行失衡，注意脾胃心血管"
  },
  studies: {
    旺: "印星临身，文思如泉",
    强: "印星得力，宜读宜写",
    平: "学习平稳，需主动用功",
    弱: "印星受克，专注力下降",
    衰: "心神浮动，宜整理思路"
  },
  social: {
    旺: "食伤当令，贵人相助",
    强: "人缘和顺，多得助力",
    平: "食伤平和，社交克制",
    弱: "言多有失，少争为佳",
    衰: "食伤受冲，慎防口舌是非"
  }
};


// 等级配色（收敛为品牌序阶：强势=古铜橙强调，中性偏弱=墨灰；不用彩虹随机色）
// 色值取自设计系统 token：accent-soft/accent/accent-hover 与 border-light/gray。
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  '旺': { bg: '#EFEDEA', text: '#1C1A16' }, // accent-soft / accent
  '强': { bg: '#F6F4F1', text: '#3A352E' }, // accent-tint / accent-hover
  '平': { bg: '#F3F4F6', text: '#6B7280' }, // border-light / gray
  '弱': { bg: '#F3F4F6', text: '#6B7280' },
  '衰': { bg: '#F3F4F6', text: '#6B7280' },
};

// 分数→等级映射
function scoreToLevel(score: number): string {
  if (score >= 90) return '旺';
  if (score >= 70) return '强';
  if (score >= 50) return '平';
  if (score >= 30) return '弱';
  return '衰';
}

// 命理术语关键词
const MINGLI_KEYWORDS = ['日主', '官星', '印星', '财星', '比劫', '食伤', '桃花', '夫妻宫', '文昌', '日元', '五行', '贵人', '得令', '失令', '当令', '受克', '相生', '受冲', '临平', '得力', '得地', '临身'];

// 判断文本是否包含命理术语
function hasMingliTerm(text: string): boolean {
  return MINGLI_KEYWORDS.some(kw => text.includes(kw));
}

// 五维进度条
function ProgressBar({ label, value, max = 100, color = 'bg-brand-black' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-brand-gray">{label}</span>
        <span className="text-sm font-medium text-brand-black">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-brand-border-light overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// 五行小卡片
const wuxingItems = [
  { key: 'wood', label: '木', icon: '🌿', variant: 'wood' as const, desc: '生长' },
  { key: 'fire', label: '火', icon: '🔥', variant: 'fire' as const, desc: '热情' },
  { key: 'earth', label: '土', icon: '⛰', variant: 'earth' as const, desc: '稳定' },
  { key: 'metal', label: '金', icon: '⚙️', variant: 'metal' as const, desc: '坚毅' },
  { key: 'water', label: '水', icon: '💧', variant: 'water' as const, desc: '智慧' },
];

// 五行人话解读映射表（key 形如 'fire-旺'）
const WUXING_HINT: Record<string, string> = {
  'fire-旺': '今日易急躁',
  'fire-衰': '注意心血',
  'fire-弱': '注意心血',
  'water-旺': '思虑活跃',
  'water-衰': '注意补水休息',
  'water-弱': '注意补水休息',
  'wood-旺': '行动力强',
  'wood-衰': '易疲惫',
  'wood-弱': '易疲惫',
  'earth-旺': '沉稳务实',
  'earth-衰': '脾胃留意',
  'earth-弱': '脾胃留意',
  'metal-旺': '决断力佳',
  'metal-衰': '少争为宜',
  'metal-弱': '少争为宜',
};

// 日期切换
const dayOffsetTexts: Record<string, { short: string; loading: string }> = {
  '-1': { short: '昨日', loading: '正在推算昨日运势...' },
  '0': { short: '今日', loading: '正在推算今日运势...' },
  '1': { short: '明日', loading: '正在推算明日运势...' },
  '2': { short: '后日', loading: '正在推算后日运势...' },
};
const getDayOffsetText = (offset: string) => dayOffsetTexts[offset] ?? { short: '该日', loading: '正在推算运势...' };

// 内联月历组件
function InlineCalendar({ selectedDate, onSelect }: { selectedDate: string; onSelect: (date: string) => void }) {
  const { year: selY, month: selM } = (() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return { year: y, month: m };
  })();
  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM);

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); }
    else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const weekDayHeaders = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="mt-2 bg-white rounded-card border border-brand-border-light shadow-card p-4">
      {/* 月份切换 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} aria-label="上个月" className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-brand-border-light rounded-lg text-brand-ink">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="text-sm font-semibold text-brand-ink">{viewYear}年{viewMonth}月</span>
        <button onClick={nextMonth} aria-label="下个月" className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-brand-border-light rounded-lg text-brand-ink">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 星期头 */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayHeaders.map((w) => (
          <div key={w} className="text-center text-xs py-1 text-brand-gray">{w}</div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={idx}
              onClick={() => onSelect(dateStr)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium relative
                ${isSelected ? 'bg-brand-accent text-white' : isToday ? 'bg-brand-accent-tint text-brand-ink' : 'hover:bg-brand-border-light text-brand-ink'}
              `}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 周视图日历组件
function WeekCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const getWeekDays = (base: string) => {
    const d = new Date(base + 'T00:00:00');
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  return (
    <>
      <div className="flex items-stretch bg-white rounded-card border border-brand-border-light shadow-card">
        {/* 7天横向列表 */}
        <div className="flex flex-1 justify-around">
          {weekDays.map((date, i) => {
            const isSelected = date === selectedDate;
            const isToday = date === todayStr;
            const dayNum = date.split('-')[2].replace(/^0/, '');
            return (
              <button
                key={date}
                onClick={() => onSelect(date)}
                className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${isSelected ? 'border-b-2 border-brand-accent' : 'hover:bg-brand-border-light'}`}
              >
                <span
                  className={`text-xs font-medium ${isSelected ? 'text-brand-accent' : isToday ? 'text-brand-ink' : 'text-brand-gray'}`}
                >
                  周{weekLabels[i]}
                </span>
                <span
                  className={`relative text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isSelected ? 'bg-brand-accent text-white' : 'text-brand-ink'}`}
                >
                  {dayNum}
                  {isToday && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-accent'}`}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* 分割线 */}
        <div className="w-px bg-brand-border-light flex-shrink-0 self-stretch" />

        {/* 月历按钮 */}
        <button
          onClick={() => setShowMonthPicker(true)}
          className="flex flex-col items-center justify-center px-4 gap-1 min-h-[44px] hover:bg-brand-border-light transition-colors"
        >
          <span className="text-xs text-brand-gray">月历</span>
          <span className="text-base">📅</span>
        </button>
      </div>

      {/* 月历弹窗 */}
      {showMonthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowMonthPicker(false)}
          />
          <div className="relative w-[90%] max-w-sm bg-white rounded-card p-4 shadow-pricing">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-brand-ink">选择日期</h3>
              <button
                onClick={() => setShowMonthPicker(false)}
                aria-label="关闭"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 text-brand-light hover:text-brand-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InlineCalendar
              selectedDate={selectedDate}
              onSelect={(date) => {
                onSelect(date);
                setShowMonthPicker(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function DailyPage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [isVip, setIsVip] = useState(false);
  useEffect(() => {
    if (!session) { setIsVip(false); return; }
    (async () => {
      try {
        const res = await fetch('/api/user/quota');
        if (!res.ok) return;
        const data = await res.json();
        setIsVip(Boolean(data?.isMember));
      } catch {}
    })();
  }, [session]);
  const [formData, setFormData] = useState({ birthDate: '', birthHour: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DailyResult | null>(null);
  const [today, setToday] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [hasSavedData, setHasSavedData] = useState(false);
  const autoSubmittedRef = useRef(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!shareCardRef.current || !result) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, { scale: 2, backgroundColor: '#FAF9F6' });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const file = new File([blob], 'cyberfate-daily.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '今日运势 - CyberFate' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'cyberfate-daily.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error('Share failed:', e); }
  };

  const fetchFortune = async (birthDate: string, birthHour: string, targetDate: string, gender?: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, birthHour: parseInt(birthHour), targetDate, gender: gender || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 400 && data.code === 'MISSING_BIRTH_DATE') {
          setHasSavedData(false);
          setError('请填写出生日期和时辰后再查看运势');
        } else {
          throw new Error(data.error || data.message || '获取运势失败');
        }
        return;
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setToday(dateStr);
    const saved = loadBirthInfo();
    if (saved?.birthDate && saved?.birthHour) {
      setFormData({ birthDate: saved.birthDate, birthHour: saved.birthHour, gender: saved.gender || '' });
      setHasSavedData(true);
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        fetchFortune(saved.birthDate, saved.birthHour, dateStr, saved.gender || undefined);
      }
    }
  }, []);

  const clearSavedData = () => {
    clearBirthInfo();
    setFormData({ birthDate: '', birthHour: '', gender: '' });
    setHasSavedData(false);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    // 未登录拦截
    if (!session) {
      setAuthOpen(true);
      return;
    }
    if (!formData.birthDate) { setError('请选择出生日期'); return; }
    if (!formData.birthHour) { setError('请选择出生时辰'); return; }
    setLoading(true);
    const startTime = Date.now();
    track('tool_ai_trigger', { tool: 'daily' });
    try {
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate: formData.birthDate, birthHour: parseInt(formData.birthHour), targetDate: today, gender: formData.gender || undefined }),
      });
      if (!response.ok) throw new Error('获取运势失败');
      setResult(await response.json());
      track('tool_ai_complete', { tool: 'daily', duration_ms: Date.now() - startTime });
      track('daily_fortune_view', { tool: 'daily' });
      saveBirthInfo(formData);
    } catch (err) {
      track('tool_ai_error', { tool: 'daily', error_type: 'api_error' });
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const [dayOffset, setDayOffset] = useState('0');
  const [expandedRating, setExpandedRating] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const currentDayText = getDayOffsetText(dayOffset);

  const handleDateChange = (offset: string) => {
    setDayOffset(offset);
    const d = new Date();
    d.setDate(d.getDate() + parseInt(offset));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (formData.birthDate && formData.birthHour) {
      setResult(null);
      fetchFortune(formData.birthDate, formData.birthHour, dateStr, formData.gender || undefined);
    }
  };

  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* 页面标题 */}
      <div className="text-center pt-10 sm:pt-12 md:pt-16 pb-6">
        <h1 className="font-display text-h1 md:text-[44px] text-brand-ink" style={{ letterSpacing: '10px' }}>每日运势</h1>
        <p className="text-body-sm text-brand-gray mt-3">
          每日运势分析，是东方智慧的凝练，更是你掌握当下、规划未来的参照。
        </p>
      </div>

      {/* 周视图日期选择器 */}
      <div className="px-4 max-w-page mx-auto mb-6">
        <WeekCalendar
            selectedDate={(() => {
              const d = new Date(today + 'T00:00:00');
              d.setDate(d.getDate() + Number(dayOffset));
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })()}
            onSelect={(date) => {
              if (!today) return;
              const base = new Date(today + 'T00:00:00');
              const sel = new Date(date + 'T00:00:00');
              const diff = Math.round((sel.getTime() - base.getTime()) / 86400000);
              setDayOffset(String(diff));
              const dateStr = date;
              if (formData.birthDate && formData.birthHour) {
                setResult(null);
                fetchFortune(formData.birthDate, formData.birthHour, dateStr, formData.gender || undefined);
              }
            }}
          />
      </div>

      <Container>
        {/* 输入表单（紧凑版） */}
        {!hasSavedData && !result && (
          <Card hover={false} className="max-w-page mx-auto mb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-brand-gray text-center mb-4">输入出生信息获取专属运势</p>
              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="min-h-[44px] rounded-lg"
              />
              <Select label="出生时辰" options={shichenOptions} value={formData.birthHour} onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })} required />
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <Button type="submit" variant="primary" loading={loading} className="w-full">查看{currentDayText.short}运势</Button>
            </form>
          </Card>
        )}

        {/* 已保存数据提示 */}
        {hasSavedData && !result && !loading && !error && (
          <div className="text-center mb-8 py-4">
            <p className="text-sm text-brand-gray">已记住您的出生信息，正在加载运势...</p>
            <button onClick={clearSavedData} className="text-xs text-brand-gray hover:text-brand-accent mt-2 underline min-h-[44px]">重新输入</button>
          </div>
        )}

        {/* 已保存数据但加载失败 */}
        {hasSavedData && !result && !loading && error && (
          <div className="max-w-page mx-auto mb-8 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => fetchFortune(formData.birthDate, formData.birthHour, today, formData.gender || undefined)}
                className="text-sm text-brand-ink hover:text-brand-accent underline min-h-[44px] px-2"
              >
                重试
              </button>
              <button onClick={clearSavedData} className="text-sm text-brand-gray hover:text-brand-accent underline min-h-[44px] px-2">
                重新输入
              </button>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <Card hover={false} className="max-w-page mx-auto flex flex-col items-center py-12">
            <Sparkles className="w-8 h-8 animate-spin text-brand-light" />
            <p className="mt-4 text-brand-black font-medium">{currentDayText.loading}</p>
          </Card>
        )}

        {/* ===== 结果展示 ===== */}
        {result && !loading && (
          <div className="max-w-page mx-auto px-4 space-y-5 pb-20 md:pb-26 animate-fadeIn">

            {/* 今日核心速览 - 极简风（Card + token） */}
            <Card variant="flat" hover={false}>
              {/* 月份年份行 */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-brand-border-light">
                <span className="text-body-sm text-brand-gray tracking-[2px]">
                  {(() => { const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return months[d.getMonth()]; })()}
                </span>
                <span className="text-body-sm text-brand-gray tracking-[2px]">
                  {(() => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return d.getFullYear(); })()}
                </span>
              </div>

              {/* 大日期 */}
              <div className="mb-5">
                <div className="font-heading font-light text-brand-ink leading-none text-[72px] sm:text-[80px]">
                  {(() => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return d.getDate(); })()}
                </div>
                <div className="text-[13px] text-brand-gray mt-2">
                  {(() => { const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return days[d.getDay()]; })()} · {result.dayGanzhi}日 · {result.lunarDate}
                </div>
              </div>

              {/* 判词区 */}
              <div className="mb-4">
                <span className="font-serif font-semibold text-brand-ink text-[28px] tracking-[4px]">
                  {result.headline || (result.overall >= 4 ? '乘势而为' : result.overall >= 3 ? '守正待机' : '韬光养晦')}
                </span>
                <span className="text-[28px] text-brand-light ml-2 tracking-[6px]">····</span>
              </div>

              {/* 一句话解读 */}
              <div className="mb-6">
                <p className="text-body-sm text-brand-gray leading-relaxed max-w-[480px]">
                  {result.briefing || (result.advice || '').slice(0, 50)}
                </p>
              </div>

              {/* 宜忌 - 极简双栏 */}
              <div className="grid grid-cols-[1fr_1px_1fr] w-full mt-6 pt-6 border-t border-brand-border-light">
                {/* 宜 */}
                <div className="pr-4">
                  <div className="text-[13px] text-brand-gray tracking-[2px] mb-3">宜 · DO</div>
                  <div className="text-body-sm text-brand-ink leading-loose">
                    {result.suitable.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                </div>
                {/* 分隔线 */}
                <div className="bg-brand-border-light" />
                {/* 忌 */}
                <div className="pl-4">
                  <div className="text-[13px] text-brand-gray tracking-[2px] mb-3">忌 · DON&apos;T</div>
                  <div className="text-body-sm text-brand-ink leading-loose">
                    {result.avoid.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 幸运信息极简条 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 mt-2">
                <span className="text-caption text-brand-gray">幸运颜色 <span className="font-medium text-brand-ink">{result.lucky.color}</span></span>
                <span className="w-px h-3 bg-brand-border" />
                <span className="text-caption text-brand-gray">幸运数字 <span className="font-medium text-brand-ink">{result.lucky.numbers.join('·')}</span></span>
                <span className="w-px h-3 bg-brand-border" />
                <span className="text-caption text-brand-gray">方位 <span className="font-medium text-brand-ink">{result.lucky.direction}</span></span>
              </div>

              {/* 金句 / 品牌区 */}
              <div className="flex items-end justify-between gap-6 pt-5 mt-6 border-t border-brand-border-light">
                <div className="flex-1 min-w-0">
                  {result.verse && (
                    <p className="text-[13px] text-brand-gray italic leading-relaxed whitespace-pre-line">
                      「{result.verse}」
                    </p>
                  )}
                </div>
                <span className="self-end text-[13px] tracking-[2px] text-brand-gray whitespace-nowrap">
                  CYBERFATE
                </span>
              </div>

            </Card>

            {/* 今日五行强弱 */}
            <div className="grid grid-cols-5 gap-2">
              {(() => {
                const ganToWuxing: Record<string, string> = {
                  甲: 'wood', 乙: 'wood',
                  丙: 'fire', 丁: 'fire',
                  戊: 'earth', 己: 'earth',
                  庚: 'metal', 辛: 'metal',
                  壬: 'water', 癸: 'water',
                };
                const wuxingGenerates: Record<string, string> = {
                  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
                };
                const dayGan = result.dayGanzhi?.[0] || '';
                const wangWuxing = ganToWuxing[dayGan] || null;
                const secondaryWuxing = wangWuxing ? wuxingGenerates[wangWuxing] : null;

                return wuxingItems.map((item) => {
                  const isWang = item.key === wangWuxing;
                  const isSecondary = item.key === secondaryWuxing;
                  // 五行配色唯一真源：从 WUXING 取，不再本地手写每个元素的色值
                  const colors = WUXING[item.variant];
                  let bgColor: string;
                  let textColor: string;
                  let opacity: number;
                  let border: string;
                  if (isWang) {
                    bgColor = colors.bg;
                    textColor = colors.text;
                    opacity = 1;
                    border = `2px solid ${colors.text}`;
                  } else if (isSecondary) {
                    bgColor = colors.bg;
                    textColor = colors.text;
                    opacity = 0.65;
                    border = `1px solid ${colors.bg}`;
                  } else {
                    bgColor = 'rgba(28, 26, 22, 0.03)';
                    textColor = 'rgba(28, 26, 22, 0.25)';
                    opacity = 1;
                    border = '1px solid rgba(28, 26, 22, 0.06)';
                  }
                  // 五行等级计算：日主同行=旺，生我=强，我生=平，克我=弱，我克=衰
                  // 强弱顺序：旺 > 强 > 平 > 弱 > 衰
                  const wuxingOrder = ['wood', 'fire', 'earth', 'metal', 'water'];
                  const masterWuxingKey = wangWuxing; // 日主五行
                  let levelLabel = '平';
                  if (masterWuxingKey) {
                    const mIdx = wuxingOrder.indexOf(masterWuxingKey);
                    if (item.key === masterWuxingKey) levelLabel = '旺';
                    else if (wuxingOrder[(mIdx + 4) % 5] === item.key) levelLabel = '强'; // 生我(相)
                    else if (wuxingOrder[(mIdx + 1) % 5] === item.key) levelLabel = '平'; // 我生(休)
                    else if (wuxingOrder[(mIdx + 2) % 5] === item.key) levelLabel = '弱'; // 克我(囚)
                    else if (wuxingOrder[(mIdx + 3) % 5] === item.key) levelLabel = '衰'; // 我克(死)
                  }
                  const hint = WUXING_HINT[item.key + '-' + levelLabel] || (levelLabel === '平' || levelLabel === '强' ? '平稳' : '');
                  return (
                    <div
                      key={item.key}
                      className="rounded-card text-center"
                      style={{ backgroundColor: bgColor, opacity, border, minHeight: 72, padding: '8px 6px' }}
                    >
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <span className="block mt-0.5" style={{ fontSize: 15, fontWeight: 600, color: textColor }}>{item.label}</span>
                      <span className="block mt-1" style={{ fontSize: 12, fontWeight: 500, color: LEVEL_COLORS[levelLabel]?.text || '#6B7280', backgroundColor: LEVEL_COLORS[levelLabel]?.bg || '#F3F4F6', borderRadius: 999, padding: '2px 8px', display: 'inline-block' }}>{levelLabel}</span>
                      {hint && (
                        <span className="block" style={{ fontSize: 12, color: 'rgba(28,26,22,0.4)', marginTop: 2, lineHeight: 1.3 }}>{hint}</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>


            {/* AI 运势建议 */}
            <div className="rounded-card border border-brand-border-light bg-brand-accent-soft p-6">
              <h4 className="text-base font-medium text-brand-accent mb-1 flex items-center gap-1.5">
                💡 今日指引
              </h4>
              <p className="text-[13px] text-brand-gray mb-2">AI 综合分析 · 仅供参考</p>
              {result.verse && (
                <p className="text-body-sm text-brand-ink italic mb-2 leading-loose">
                  「{result.verse}」
                </p>
              )}
              <p className="text-[15px] text-brand-ink leading-loose">{result.advice}</p>
            </div>

            {/* 命理脉络（默认展开） */}
            {hasSavedData && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className={`w-full flex items-center justify-between px-4 py-3 min-h-[44px] bg-white border border-brand-border-light rounded-card hover:bg-brand-bg transition-colors ${showTimeline ? 'mb-3' : ''}`}
                  aria-expanded={showTimeline}
                >
                  <span className="text-body-sm font-medium text-brand-ink">📊 命理脉络（大运·流年·流月）</span>
                  <span className="text-caption text-brand-gray inline-block transition-transform duration-200" style={{ transform: showTimeline ? 'rotate(180deg)' : 'none' }}>▾</span>
                </button>
                {showTimeline && (
                  <TimelineSection
                    birthDate={formData.birthDate}
                    birthHour={formData.birthHour}
                    gender={formData.gender}
                    targetDate={(() => {
                      const d = new Date(today + 'T00:00:00');
                      d.setDate(d.getDate() + Number(dayOffset));
                      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    })()}
                  />
                )}
              </div>
            )}

            {/* 每日运势详细分析 - v2 黑白极简卡 */}
            <DailyDetailAnalysis
              isLoggedIn={!!session}
              isVip={isVip}
              onLoginRequired={() => setAuthOpen(true)}
              targetDate={(() => {
                const d = new Date(today + 'T00:00:00');
                d.setDate(d.getDate() + Number(dayOffset));
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
              })()}
              hasBirthInfo={!!formData.birthDate}
            />

            {/* 🎵 今日之歌 */}
            {/* AI 运势问答 */}
            <DailyFortuneQA
              isLoggedIn={!!session}
              isVip={isVip}
              onLoginRequired={() => setAuthOpen(true)}
              hasBirthInfo={!!formData.birthDate}
            />

            <DailyMusicCard />



            {/* 八字深度分析卡片 */}
            <Link href="/bazi" className="flex items-center gap-3 px-4 py-3.5 min-h-[44px] bg-white rounded-card border border-brand-border-light hover:border-brand-accent/40 transition-colors">
              <span className="text-2xl shrink-0">☰</span>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium text-brand-ink">八字深度分析</div>
                <div className="text-caption text-brand-gray mt-0.5">解读完整命盘与流年大运</div>
              </div>
              <span className="shrink-0 bg-brand-accent text-white px-3 py-1.5 rounded-lg text-caption font-medium">查看</span>
            </Link>

            {/* 六爻起卦入口 - 保留 /liuyao 通道 */}
            <Link href='/liuyao' className="flex items-center gap-3 px-4 py-3.5 min-h-[44px] bg-white rounded-card border border-brand-border-light hover:border-brand-accent/40 transition-colors">
              <span className="text-2xl shrink-0">☷</span>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium text-brand-ink">六爻起卦</div>
                <div className="text-caption text-brand-gray mt-0.5">AI 即时解卦，针对具体事项</div>
              </div>
              <span className="shrink-0 bg-brand-accent text-white px-3 py-1.5 rounded-lg text-caption font-medium">起卦</span>
            </Link>

            {/* 分享今日运势 */}
            <div className="mt-3 pt-3 border-t border-brand-border-light">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg border-[1.5px] border-brand-ink/20 text-[13px] text-brand-ink bg-transparent hover:bg-brand-accent-tint hover:border-brand-accent/40 transition-colors"
              >
                📤 分享今日运势
              </button>
            </div>

            {/* 免责声明 */}
            <AiDisclaimer />
            <div className="text-center text-xs text-brand-gray py-3 bg-brand-bg rounded-lg">
              ⚠️ 免责声明：运势分析仅供娱乐参考，不构成任何决策建议。请理性对待。
            </div>
          </div>
        )}
      </Container>

      {/* 隐藏的分享卡片 */}
      <div ref={shareCardRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: 375, padding: 24, backgroundColor: '#FAF9F6' }}>
        {result && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C1A16', marginBottom: 8 }}>
              {result.date} · {result.overallLabel || '平'}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              今日干支：{result.dayGanzhi}
            </p>
            {result.suitable && result.suitable.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>宜</p>
                <p style={{ fontSize: 14, color: '#1C1A16' }}>{result.suitable.slice(0, 3).join(' · ')}</p>
              </div>
            )}
            {result.verse && (
              <p style={{ fontSize: 12, color: '#92400E', fontStyle: 'italic', marginBottom: 12 }}>
                「{result.verse}」
              </p>
            )}
            <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>CyberFate · 赛博命理师</p>
              <p style={{ fontSize: 10, color: '#D1D5DB' }}>www.cyberfate.me</p>
            </div>
          </div>
        )}
      </div>

      <div className="hidden" data-version="20260528-v3"></div>

      {/* 登录弹窗 */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        callbackUrl="/daily"
        reason={{
          title: '登录后即可查看每日运势',
          desc: '登录或注册账号即可免费查看每日运势；开通会员不限次并解锁更多权益。',
        }}
      />
    </div>
  );
}

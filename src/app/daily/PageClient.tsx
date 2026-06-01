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


// 等级配色（语义色）
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  '旺': { bg: '#F3E8FF', text: '#9333EA' },
  '强': { bg: '#DBEAFE', text: '#2563EB' },
  '平': { bg: '#F3F4F6', text: '#6B7280' },
  '弱': { bg: '#FEF3C7', text: '#D97706' },
  '衰': { bg: '#FEE2E2', text: '#DC2626' },
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
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
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
    <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* 月份切换 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="text-sm font-semibold text-[#1C1A16]">{viewYear}年{viewMonth}月</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 星期头 */}
      <div className="grid grid-cols-7 mb-1">
        {weekDayHeaders.map((w, i) => (
          <div key={w} className={`text-center text-xs py-1 ${i === 0 || i === 6 ? 'text-red-400' : 'text-gray-400'}`}>{w}</div>
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
                ${isSelected ? 'bg-[#0F0F0F] text-white' : isToday ? 'bg-amber-50 text-[#1C1A16]' : 'hover:bg-gray-50 text-[#1C1A16]'}
              `}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
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
      <div className="flex items-stretch bg-white rounded-xl border border-gray-200 shadow-sm">
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
                className={`flex-shrink-0 flex flex-col items-center py-2.5 gap-0.5 transition-colors w-10 ${isSelected ? '' : 'hover:bg-gray-50'}`}
                style={isSelected ? { borderBottom: '2px solid #0F0F0F' } : undefined}
              >
                <span
                  className={`text-[10px] font-medium`}
                  style={{ color: isSelected ? '#0F0F0F' : isToday ? '#1C1A16' : '#6B7280' }}
                >
                  周{weekLabels[i]}
                </span>
                <span
                  className={`relative text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full`}
                  style={isSelected
                    ? { backgroundColor: '#1C1A16', color: 'white' }
                    : { color: '#1C1A16' }
                  }
                >
                  {dayNum}
                  {isToday && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* 分割线 */}
        <div className="w-px bg-gray-200 flex-shrink-0 self-stretch" />

        {/* 月历按钮 */}
        <button
          onClick={() => setShowMonthPicker(true)}
          className="flex flex-col items-center justify-center px-4 gap-1 hover:bg-gray-50 transition-colors"
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
          <div className="relative w-[90%] max-w-sm bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#1C1A16]">选择日期</h3>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="p-1 text-[#1C1A16]/40 hover:text-[#1C1A16]"
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
    try {
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate: formData.birthDate, birthHour: parseInt(formData.birthHour), targetDate: today, gender: formData.gender || undefined }),
      });
      if (!response.ok) throw new Error('获取运势失败');
      setResult(await response.json());
      saveBirthInfo(formData);
    } catch (err) {
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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* 页面标题 */}
      <div className="text-center pt-6 md:pt-12 pb-6">
        <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>每日运势</h1>
        <p className="text-body-sm text-[#1C1A16]/70 mt-3">
          每日运势分析，是东方智慧的凝练，更是你掌握当下、规划未来的参照。
        </p>
      </div>

      {/* 周视图日期选择器 */}
      <div className="px-4 max-w-7xl mx-auto mb-6">
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
          <Card hover={false} className="max-w-[500px] mx-auto mb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-brand-gray text-center mb-4">输入出生信息获取专属运势</p>
              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
                className="space-y-1.5"
                triggerClassName="h-10 rounded-lg"
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
            <button onClick={clearSavedData} className="text-xs text-brand-light hover:text-brand-black mt-2 underline">重新输入</button>
          </div>
        )}

        {/* 已保存数据但加载失败 */}
        {hasSavedData && !result && !loading && error && (
          <div className="max-w-[500px] mx-auto mb-8 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => fetchFortune(formData.birthDate, formData.birthHour, today, formData.gender || undefined)}
                className="text-sm text-brand-black hover:text-brand-light underline"
              >
                重试
              </button>
              <button onClick={clearSavedData} className="text-sm text-brand-light hover:text-brand-black underline">
                重新输入
              </button>
            </div>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <Card hover={false} className="max-w-[500px mx-auto flex flex-col items-center py-12">
            <Sparkles className="w-8 h-8 animate-spin text-brand-light" />
            <p className="mt-4 text-brand-black font-medium">{currentDayText.loading}</p>
          </Card>
        )}

        {/* ===== 结果展示 ===== */}
        {result && !loading && (
          <div className="space-y-5 pb-20 md:pb-26 animate-fadeIn">

            {/* 今日核心速览 - 极简风 */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid rgba(28,26,22,0.06)', padding: '32px 24px' }}>
              {/* 月份年份行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(28,26,22,0.06)', marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: 'rgba(28,26,22,0.45)', letterSpacing: 2, fontFamily: 'Inter, sans-serif' }}>
                  {(() => { const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return months[d.getMonth()]; })()}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(28,26,22,0.45)', letterSpacing: 2, fontFamily: 'Inter, sans-serif' }}>
                  {(() => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return d.getFullYear(); })()}
                </span>
              </div>

              {/* 大日期 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 80, fontWeight: 300, color: '#1C1A16', lineHeight: 1, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {(() => { const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return d.getDate(); })()}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(28,26,22,0.55)', marginTop: 8 }}>
                  {(() => { const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const d = new Date(today + 'T00:00:00'); d.setDate(d.getDate() + Number(dayOffset)); return days[d.getDay()]; })()} · {result.dayGanzhi}日 · {result.lunarDate}
                </div>
              </div>

              {/* 判词区 */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 600, color: '#1C1A16', letterSpacing: 4, fontFamily: 'Noto Serif SC, serif' }}>
                  {result.headline || (result.overall >= 4 ? '乘势而为' : result.overall >= 3 ? '守正待机' : '韬光养晦')}
                </span>
                <span style={{ fontSize: 28, color: 'rgba(28,26,22,0.35)', marginLeft: 8, letterSpacing: 6 }}>····</span>
              </div>

              {/* 一句话解读 */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 14, color: 'rgba(28,26,22,0.65)', lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
                  {result.briefing || (result.advice || '').slice(0, 50)}
                </p>
              </div>

              {/* 宜忌 - 极简双栏 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, padding: 0, width: '100%', marginTop: 24, borderTop: '1px solid rgba(28,26,22,0.06)', paddingTop: 24 }}>
                {/* 宜 */}
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontSize: 13, color: 'rgba(28,26,22,0.45)', letterSpacing: 2, marginBottom: 12 }}>宜 · DO</div>
                  <div style={{ fontSize: 14, color: '#1C1A16', lineHeight: 2.0 }}>
                    {result.suitable.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                </div>
                {/* 分隔线 */}
                <div style={{ backgroundColor: 'rgba(28,26,22,0.08)' }} />
                {/* 忌 */}
                <div style={{ paddingLeft: 16 }}>
                  <div style={{ fontSize: 13, color: 'rgba(28,26,22,0.45)', letterSpacing: 2, marginBottom: 12 }}>忌 · DON&apos;T</div>
                  <div style={{ fontSize: 14, color: '#1C1A16', lineHeight: 2.0 }}>
                    {result.avoid.map((item, i) => (
                      <div key={i}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 幸运信息极简条 */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, padding: '12px 0', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)' }}>幸运颜色 <span style={{ fontWeight: 500, color: '#1C1A16' }}>{result.lucky.color}</span></span>
                <span style={{ width: 1, height: 12, backgroundColor: 'rgba(28,26,22,0.12)' }} />
                <span style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)' }}>幸运数字 <span style={{ fontWeight: 500, color: '#1C1A16' }}>{result.lucky.numbers.join('·')}</span></span>
                <span style={{ width: 1, height: 12, backgroundColor: 'rgba(28,26,22,0.12)' }} />
                <span style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)' }}>方位 <span style={{ fontWeight: 500, color: '#1C1A16' }}>{result.lucky.direction}</span></span>
              </div>

              {/* 金句 / 品牌区 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, borderTop: '1px solid rgba(28,26,22,0.06)', paddingTop: 20, marginTop: 24 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {result.verse && (
                    <p style={{ fontSize: 13, color: 'rgba(28,26,22,0.55)', fontStyle: 'italic', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                      「{result.verse}」
                    </p>
                  )}
                </div>
                <span style={{ alignSelf: 'flex-end', fontSize: 13, letterSpacing: 2, color: 'rgba(28,26,22,0.35)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                  CYBERFATE
                </span>
              </div>

            </div>

            {/* 今日五行强弱 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
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
                const wuxingColors: Record<string, { text: string; bg: string; border: string }> = {
                  wood: { text: '#10B981', bg: '#D1FAE5', border: 'rgba(16,185,129,0.25)' },
                  fire: { text: '#EF4444', bg: '#FEE2E2', border: 'rgba(239,68,68,0.25)' },
                  earth: { text: '#D97706', bg: '#FEF0CD', border: 'rgba(217,119,6,0.25)' },
                  metal: { text: '#F59E0B', bg: '#FEF3C7', border: 'rgba(245,158,11,0.25)' },
                  water: { text: '#3B82F6', bg: '#DBEAFE', border: 'rgba(59,130,246,0.25)' },
                };
                const dayGan = result.dayGanzhi?.[0] || '';
                const wangWuxing = ganToWuxing[dayGan] || null;
                const secondaryWuxing = wangWuxing ? wuxingGenerates[wangWuxing] : null;

                return wuxingItems.map((item) => {
                  const isWang = item.key === wangWuxing;
                  const isSecondary = item.key === secondaryWuxing;
                  const colors = wuxingColors[item.key];
                  let bgColor: string;
                  let textColor: string;
                  let opacity: number;
                  let border: string;
                  if (isWang) {
                    bgColor = colors.bg;
                    textColor = colors.text;
                    opacity = 1;
                    border = `2px solid ${colors.border}`;
                  } else if (isSecondary) {
                    bgColor = colors.bg;
                    textColor = colors.text;
                    opacity = 0.65;
                    border = `1px solid ${colors.border}`;
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
                      className="rounded-xl text-center"
                      style={{ backgroundColor: bgColor, opacity, border, minHeight: 72, padding: '8px 6px' }}
                    >
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <span className="block mt-0.5" style={{ fontSize: 15, fontWeight: 600, color: textColor }}>{item.label}</span>
                      <span className="block mt-1" style={{ fontSize: 11, fontWeight: 500, color: LEVEL_COLORS[levelLabel]?.text || '#6B7280', backgroundColor: LEVEL_COLORS[levelLabel]?.bg || '#F3F4F6', borderRadius: 999, padding: '2px 8px', display: 'inline-block' }}>{levelLabel}</span>
                      {hint && (
                        <span className="block" style={{ fontSize: 10, color: 'rgba(28,26,22,0.4)', marginTop: 2, lineHeight: 1.3 }}>{hint}</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>


            {/* AI 运势建议 */}
            <Card hover={false} className="bg-yellow-50 border-yellow-200">
              <h4 className="font-medium text-yellow-700 mb-1 flex items-center gap-1.5" style={{ fontSize: 16 }}>
                💡 今日指引
              </h4>
              <p className="text-yellow-600/70 mb-2" style={{ fontSize: 13 }}>AI 综合分析 · 仅供参考</p>
              {result.verse && (
                <p style={{ fontSize: 14, color: '#92400E', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.8 }}>
                  「{result.verse}」
                </p>
              )}
              <p className="text-gray-700" style={{ fontSize: 15, lineHeight: 1.8 }}>{result.advice}</p>
            </Card>

            {/* 命理脉络（默认展开） */}
            {hasSavedData && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', marginBottom: showTimeline ? 12 : 0 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>📊 命理脉络（大运·流年·流月）</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', transform: showTimeline ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
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
            <Link href="/bazi">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', cursor: 'pointer' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>☰</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>八字深度分析</div>
                  <div style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)', marginTop: 2 }}>解读完整命盘与流年大运</div>
                </div>
                <button style={{ backgroundColor: '#C8622A', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0 }}>查看</button>
              </div>
            </Link>

            {/* 六爻起卦入口 - 保留 /liuyao 通道 */}
            <Link href='/liuyao'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', cursor: 'pointer' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>☷</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>六爻起卦</div>
                  <div style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)', marginTop: 2 }}>AI 即时解卦，针对具体事项</div>
                </div>
                <button style={{ backgroundColor: '#1F2937', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0 }}>起卦</button>
              </div>
            </Link>

            {/* 分享今日运势 */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={handleShare}
                className="hover:bg-[rgba(28,26,22,0.04)] hover:border-[rgba(28,26,22,0.35)] transition-colors"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1.5px solid rgba(28, 26, 22, 0.20)', borderRadius: 8, backgroundColor: 'transparent', fontSize: 13, color: '#1C1A16', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
              >
                📤 分享今日运势
              </button>
            </div>

            {/* 免责声明 */}
            <AiDisclaimer />
            <div className="text-center text-xs text-brand-light py-3 bg-brand-bg rounded-lg">
              ⚠️ 免责声明：运势分析仅供娱乐参考，不构成任何决策建议。请理性对待。
            </div>
          </div>
        )}
      </Container>

      <Footer />

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
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} callbackUrl="/daily" />
    </div>
  );
}

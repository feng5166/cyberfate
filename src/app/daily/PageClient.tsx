'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { AiDisclaimer } from '@/components/ui/AiDisclaimer';
import { Footer } from '@/components/layout/Footer';
import { saveBirthInfo, loadBirthInfo, clearBirthInfo } from '@/lib/utils/storage';
import { DatePicker } from '@/components/ui/DatePicker';
import { Sun, Cloud, Droplets, Heart, Briefcase, Activity, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import DailyMusicCard from '@/components/music-oracle/DailyMusicCard';

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
  ratings: {
    career: number;
    wealth: number;
    love: number;
    health: number;
    studies: number;
  };
  suitable: string[];
  avoid: string[];
  lucky: {
    color: string;
    numbers: number[];
    direction: string;
  };
  advice: string;
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
  };
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

// 日期切换
const dayOffsetTexts: Record<string, { short: string; loading: string }> = {
  '-1': { short: '昨日', loading: '正在推算昨日运势...' },
  '0': { short: '今日', loading: '正在推算今日运势...' },
  '1': { short: '明日', loading: '正在推算明日运势...' },
  '2': { short: '后日', loading: '正在推算后日运势...' },
};
const getDayOffsetText = (offset: string) => dayOffsetTexts[offset] ?? { short: '该日', loading: '正在推算运势...' };

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
    <div className="relative">
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
                  className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full`}
                  style={isSelected
                    ? { backgroundColor: '#0F0F0F', color: 'white' }
                    : isToday
                    ? { backgroundColor: '#1C1A16', color: 'white' }
                    : { color: '#1C1A16' }
                  }
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* 分割线 */}
        <div className="w-px bg-gray-200 flex-shrink-0 self-stretch" />

        {/* 月历按钮 */}
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex flex-col items-center justify-center px-4 gap-1 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs text-brand-gray">月历</span>
          <span className="text-base">📅</span>
        </button>
      </div>

      {/* 月历下拉 */}
      {showMonthPicker && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              onSelect(date);
              setShowMonthPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function DailyPage() {
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
      <PageHeader title="每日运势" subtitle="基于八字的个性化每日运势分析" />

      <Container>
        {/* 周视图日期选择器 */}
        <div className="mb-8">
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
        {hasSavedData && !result && !loading && (
          <div className="text-center mb-8 py-4">
            <p className="text-sm text-brand-gray">已记住您的出生信息，正在加载运势...</p>
            <button onClick={clearSavedData} className="text-xs text-brand-light hover:text-brand-black mt-2 underline">重新输入</button>
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
            <div className="text-center text-sm text-brand-gray">
              当前查询日期：<span className="text-brand-black font-medium">{result.date}</span>
            </div>
            {/* 运势概览大卡片 */}
            <Card hover={false}>
              <div className="flex items-center gap-8">
                {/* 左：运势等级 */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className="font-black"
                    style={{
                      fontSize: '80px',
                      lineHeight: 1,
                      color:
                        result.overallLabel === '高'
                          ? '#C2762B'
                          : result.overallLabel === '低'
                          ? '#9CA3AF'
                          : '#6B7280',
                    }}
                  >
                    {result.overallLabel || (result.overall >= 4 ? '高' : result.overall >= 3 ? '平' : '低')}
                  </div>
                  <p className="text-sm text-brand-gray mt-1">今日运势</p>
                </div>
                {/* 右：干支+日期 */}
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    {result.dayGanzhi.split('').map((char: string, i: number) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-xl"
                        style={{ backgroundColor: '#C2762B' }}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm text-brand-gray">
                    <p>公历：{result.date}</p>
                    <p>农历：{result.lunarDate} · {result.dayGanzhi}日</p>
                    {result.luckyHour && <p>吉时：{result.luckyHour}</p>}
                  </div>
                </div>
              </div>
            </Card>

            {/* 今日意象 + 古诗（合并暖色卡片） */}
            {(result.imageUrl || result.verse) && (
              <div className="rounded-card border border-[#E5D9C0] p-7 mt-2" style={{ backgroundColor: '#F5F0E8' }}>
                {result.imageUrl && (
                  <div className="flex justify-center py-4">
                    <div className="w-[200px] h-[200px]">
                      <img
                        src={result.imageUrl}
                        alt="今日意象"
                        className="w-full h-full object-cover"
                        style={{
                          clipPath:
                            'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        }}
                      />
                    </div>
                  </div>
                )}
                {result.verse && (
                  <div className="text-center mt-2 pb-2">
                    {result.verse.split('\n').map((line: string, i: number) => (
                      <p
                        key={i}
                        className="text-lg text-brand-black leading-relaxed"
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 五行小卡片 */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {wuxingItems.map((item) => (
                <div key={item.key} className="flex-shrink-0 rounded-xl border border-[#1C1A16]/[0.08] bg-[#FAF9F6] p-4 min-w-[100px] text-center shadow-sm">
                  <span className="text-xl">{item.icon}</span>
                  <span className="block text-xs font-medium text-brand-black mt-1">{item.label}</span>
                  <span className="block text-[10px] text-brand-light">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* 宜忌（纯文字两列） */}
            <div className="grid grid-cols-2 gap-6 px-1">
              <div className="pl-3 border-l-[3px] border-[#2D6A4F]">
                <h4 className="text-base font-semibold mb-2" style={{ color: '#2D6A4F' }}>宜</h4>
                <ul className="space-y-1">
                  {result.suitable.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
                  ))}
                </ul>
              </div>
              <div className="pl-3 border-l-[3px] border-[#9B2335]">
                <h4 className="text-base font-semibold mb-2" style={{ color: '#9B2335' }}>忌</h4>
                <ul className="space-y-1">
                  {result.avoid.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-brand-gray leading-[1.8]">· {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 幸运指南 */}
            <Card hover={false}>
              <h4 className="text-sm font-medium text-brand-black mb-4">🍀 幸运指南</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-brand-light mb-1">幸运颜色</p>
                  <p className="text-sm font-medium text-brand-black">{result.lucky.color}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-light mb-1">幸运数字</p>
                  <p className="text-sm font-medium text-brand-black">{result.lucky.numbers.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-light mb-1">幸运方位</p>
                  <p className="text-sm font-medium text-brand-black">{result.lucky.direction}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-light mb-1">吉时</p>
                  <p className="text-sm font-medium text-brand-black">{result.luckyHour || '-'}</p>
                </div>
              </div>
            </Card>

            {/* 五维运势 */}
            <Card hover={false}>
              <h4 className="text-sm font-medium text-brand-black mb-4">📊 五维运势</h4>
              <div className="space-y-4">
                {([
                  { key: 'career' as const, label: '事业运', value: result.ratings.career },
                  { key: 'wealth' as const, label: '财富运', value: result.ratings.wealth },
                  { key: 'love' as const,   label: '感情运', value: result.ratings.love },
                  { key: 'health' as const, label: '健康运', value: result.ratings.health },
                  { key: 'studies' as const, label: '学业运', value: result.ratings.studies },
                ]).map(({ key, label, value }) => {
                  const levelText = value >= 5 ? '极佳' : value >= 4 ? '良好' : value >= 3 ? '一般' : '偏弱';
                  const levelColor = value >= 5 ? '#2D6A4F' : value >= 4 ? '#C2762B' : value >= 3 ? '#6B7280' : '#9B2335';
                  const comment = result.ratingComments?.[key] || '';
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-brand-black">{label}</span>
                        <span className="text-sm font-semibold" style={{ color: levelColor }}>{levelText}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${value * 20}%`, backgroundColor: levelColor }}
                        />
                      </div>
                      {comment && (
                        <p className="text-xs text-brand-gray leading-relaxed">{comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* AI 运势建议 */}
            <Card hover={false} className="bg-yellow-50 border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-700 mb-1 flex items-center gap-1.5">
                💡 今日指引
              </h4>
              <p className="text-xs text-yellow-600/70 mb-2">AI 综合分析 · 仅供参考</p>
              <p className="text-sm leading-relaxed text-gray-700">{result.advice}</p>
            </Card>

            {/* 今日卦象入口 */}
            <div className="rounded-card border border-[#E5D9C0] p-7" style={{ backgroundColor: '#F5F0E8' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-brand-black mb-1">🔮 今日卦象</h4>
                  <p className="text-sm text-brand-gray">
                    仅为今天占卜，
                    <Link href="/liuyao" className="text-brand-black font-medium underline underline-offset-2">点此开始</Link>
                    {' '}生成卦象
                  </p>
                </div>
                <div className="text-4xl opacity-30">🪙</div>
              </div>
            </div>

            {/* 🎵 今日之歌 */}
            <DailyMusicCard />

            {/* 引导到八字分析 */}
            <Card hover={false} className="text-center py-5">
              <p className="text-sm text-brand-gray mb-2">想深入了解自己的命盘？</p>
              <Link href="/bazi">
                <Button variant="secondary" size="sm">
                  八字全面分析 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </Card>

            {/* 免责声明 */}
            <AiDisclaimer />
            <div className="text-center text-xs text-brand-light py-3 bg-brand-bg rounded-lg">
              ⚠️ 免责声明：运势分析仅供娱乐参考，不构成任何决策建议。请理性对待。
            </div>
          </div>
        )}
      </Container>

      <Footer />

      <div className="hidden" data-version="20260528-v3"></div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, ScrollText, Compass, History, ChevronDown, User } from 'lucide-react';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { CitySearch } from '@/components/ui/CitySearch';
import { loadRecords } from '@/lib/utils/history';
import type { BaziHistoryRecord } from '@/lib/bazi/types';
import { PillarTable } from '@/components/marriage/PillarTable';
import { RadarChart } from '@/components/marriage/RadarChart';
import { ShishenSection } from '@/components/marriage/ShishenSection';
import { AIAnalysisSection } from '@/components/marriage/AIAnalysisSection';
import { AIQASection } from '@/components/marriage/AIQASection';
import { track } from '@/lib/analytics';

type SideKey = 'male' | 'female';

interface SideData {
  name: string;
  gender: 'male' | 'female';
  isLunar: boolean;
  birthDate: string;
  knowTime: boolean;
  birthHourNum: number;
  birthMinute: number;
  lateZiShi: boolean;
  birthPlace: string;
}

const MARRIAGE_CACHE_KEY = 'marriage_last_query';

interface MarriageCache {
  maleData: SideData;
  femaleData: SideData;
  result: any;
  payload: any;
  aiAnalysis?: any;
  savedAt: string;
}

function loadMarriageCache(): MarriageCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MARRIAGE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MarriageCache;
  } catch {
    return null;
  }
}

const SHICHEN_BY_HOUR: Record<number, string> = {
  0: '子时', 1: '丑时', 2: '丑时',
  3: '寅时', 4: '寅时',
  5: '卯时', 6: '卯时',
  7: '辰时', 8: '辰时',
  9: '巳时', 10: '巳时',
  11: '午时', 12: '午时',
  13: '未时', 14: '未时',
  15: '申时', 16: '申时',
  17: '酉时', 18: '酉时',
  19: '戌时', 20: '戌时',
  21: '亥时', 22: '亥时',
  23: '子时',
};

const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')} 时（${SHICHEN_BY_HOUR[i]}）`,
}));

const minuteOptions = Array.from({ length: 12 }, (_, i) => {
  const m = i * 5;
  return { value: String(m), label: `${String(m).padStart(2, '0')} 分` };
});

function makeDefaultSide(gender: 'male' | 'female'): SideData {
  return {
    name: '',
    gender,
    isLunar: false,
    birthDate: '',
    knowTime: true,
    birthHourNum: 12,
    birthMinute: 0,
    lateZiShi: false,
    birthPlace: '',
  };
}

function birthHourCode(side: SideData): string {
  if (!side.knowTime) return '-1';
  const h = side.birthHourNum;
  if (h >= 23 || h < 1) return '0';
  if (h < 3) return '1';
  if (h < 5) return '2';
  if (h < 7) return '3';
  if (h < 9) return '4';
  if (h < 11) return '5';
  if (h < 13) return '6';
  if (h < 15) return '7';
  if (h < 17) return '8';
  if (h < 19) return '9';
  if (h < 21) return '10';
  return '11';
}

function HistoryFillButton({
  onPick,
}: {
  onPick: (record: BaziHistoryRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<BaziHistoryRecord[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!open) {
      setRecords(loadRecords());
    }
    setOpen(prev => !prev);
  };

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#1C1A16]/15 bg-white px-3 py-1.5 text-xs text-[#1C1A16]/80 hover:bg-[#FAF9F6] transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        从记录填充
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[#1C1A16]/10 bg-white p-2 shadow-xl">
          {records.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-[#1C1A16]/60">
              暂无历史记录
              <p className="mt-1 text-[11px] text-[#1C1A16]/40">
                先在「八字分析」生成命盘后会自动保存
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {records.map(record => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => {
                    onPick(record);
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-[#FAF9F6] transition-colors"
                >
                  <p className="text-sm font-medium text-[#1C1A16] truncate">
                    {record.name || '缘主'} · {record.gender === 'female' ? '女' : '男'}
                  </p>
                  <p className="text-xs text-[#1C1A16]/55 mt-0.5 truncate">
                    {record.birthDate} · {record.dayMaster || ''}
                    {record.birthPlace ? ` · ${record.birthPlace}` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SideFormProps {
  sideKey: SideKey;
  data: SideData;
  onChange: (patch: Partial<SideData>) => void;
}

function SideForm({ sideKey, data, onChange }: SideFormProps) {
  const isMale = sideKey === 'male';
  const sideTitle = isMale ? '男方' : '女方';

  const handleHistoryPick = (record: BaziHistoryRecord) => {
    onChange({
      name: record.name || data.name,
      gender: isMale ? 'male' : 'female',  // 强制用本侧性别，忽略历史记录的性别
      birthDate: record.birthDate || data.birthDate,
      birthPlace: record.birthPlace || data.birthPlace,
    });
  };

  const inputClass =
    'w-full min-h-[44px] rounded-lg border border-[#E5E0D8] bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/15 outline-none transition-all';
  const selectClass =
    'min-h-[44px] rounded-lg border border-[#E5E0D8] bg-white px-3 text-sm text-[#1C1A16]';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#1C1A16]/8">
        <div>
          <p className="text-xs text-[#1C1A16]/55">{sideTitle}信息</p>
          <h3 className="text-base font-semibold text-[#1C1A16]">{sideTitle}出生资料</h3>
        </div>
        <HistoryFillButton onPick={handleHistoryPick} />
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1C1A16]/70">
              姓名 <span className="text-xs text-[#1C1A16]/40">（选填）</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={`${sideTitle}姓名`}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1C1A16]/70">性别</label>
            <Select
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
              ]}
              value={data.gender}
              onChange={(e) => onChange({ gender: e.target.value as 'male' | 'female' })}
              className={selectClass}
            />
          </div>
        </div>

        <DatePicker
          label="出生日期（阳历）"
          value={data.birthDate}
          onChange={(value) => onChange({ birthDate: value })}
          className="space-y-2"
          triggerClassName="min-h-[44px] rounded-lg"
        />

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1C1A16]">知道精确出生时间</span>
              <span className="text-xs text-brand-gray mt-0.5">
                精确到分有助于排准时柱
              </span>
            </div>
            <span className="relative inline-flex shrink-0">
              <input
                type="checkbox"
                checked={data.knowTime}
                onChange={(e) => onChange({ knowTime: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="w-11 h-6 rounded-full bg-[#E5E0D8] transition-colors duration-200 peer-checked:bg-[#1C1A16]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
              />
            </span>
          </label>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              data.knowTime ? 'max-h-[160px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Select
                label="时（小时）"
                options={hourOptions}
                value={String(data.birthHourNum)}
                onChange={(e) => onChange({ birthHourNum: Number(e.target.value) })}
                className={selectClass}
              />
              <Select
                label="分"
                options={minuteOptions}
                value={String(data.birthMinute)}
                onChange={(e) => onChange({ birthMinute: Number(e.target.value) })}
                className={selectClass}
              />
            </div>
          </div>
        </div>

        <CitySearch
          label="出生地（用于真太阳时校正）"
          placeholder="如 北京市、上海市"
          value={data.birthPlace}
          onInputChange={(value) => onChange({ birthPlace: value })}
          onSelect={(city) => onChange({ birthPlace: city.name })}
        />

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#1C1A16]">晚子时（23:00 后归次日日柱）</span>
            <span className="text-xs text-brand-gray mt-0.5">
              专业命理项，仅当出生在 23:00–23:59 影响日柱
            </span>
          </div>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              checked={data.lateZiShi}
              onChange={(e) => onChange({ lateZiShi: e.target.checked })}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="w-11 h-6 rounded-full bg-[#E5E0D8] transition-colors duration-200 peer-checked:bg-[#1C1A16]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
            />
          </span>
        </label>
      </div>
    </div>
  );
}

const valueCards = [
  {
    icon: Sparkles,
    title: '智能匹配',
    desc: '融合五行互补、日干关系、生肖相合等多项传统命理算法，量化双方契合度。',
  },
  {
    icon: ScrollText,
    title: '全面解析',
    desc: '从基础契合到婚配宫位、家庭和谐多维度展开，覆盖性格、相处与长期发展。',
  },
  {
    icon: Compass,
    title: '发展参考',
    desc: 'AI 给出沟通方式与化解建议，帮助你们更清晰地看见关系中的可发挥与可改进。',
  },
];

const dimensionList = [
  { title: '基础契合度', desc: '从五行强弱与日主关系整体判断双方的契合基础' },
  { title: '性格相容性', desc: '日干十神视角观照性格、节奏与沟通模式的相容程度' },
  { title: '婚配宫位', desc: '通过日支夫妻宫与生肖关系评估婚配宫的相合或相冲' },
  { title: '家庭和谐', desc: '观照原生家庭、子女缘与共同生活节奏的长期协同' },
];

export function MarriagePageClient() {
  const [maleData, setMaleData] = useState<SideData>(() => {
    const cache = loadMarriageCache();
    return cache?.maleData ?? makeDefaultSide('male');
  });
  const [femaleData, setFemaleData] = useState<SideData>(() => {
    const cache = loadMarriageCache();
    return cache?.femaleData ?? makeDefaultSide('female');
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(() => {
    const cache = loadMarriageCache();
    return cache?.result ?? null;
  });
  const [lastPayload, setLastPayload] = useState<any>(() => {
    const cache = loadMarriageCache();
    return cache?.payload ?? null;
  });
  const [aiAnalysis, setAiAnalysis] = useState<any>(() => {
    const cache = loadMarriageCache();
    return cache?.aiAnalysis ?? null;
  });
  const [error, setError] = useState('');

  const { status } = useSession();
  const gate = useAiGate(status === 'authenticated');

  const updateMale = (patch: Partial<SideData>) => setMaleData(prev => ({ ...prev, ...patch }));
  const updateFemale = (patch: Partial<SideData>) => setFemaleData(prev => ({ ...prev, ...patch }));

  const handleAIAnalysisDone = (analysisData: any) => {
    setAiAnalysis(analysisData);
    try {
      const existing = loadMarriageCache();
      if (existing) {
        window.localStorage.setItem(MARRIAGE_CACHE_KEY, JSON.stringify({
          ...existing,
          aiAnalysis: analysisData,
        }));
      }
    } catch {
      // 忽略
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!maleData.birthDate || !femaleData.birthDate) {
      setError('请填写双方出生日期');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    track('tool_ai_trigger', { tool: 'marriage' });
    try {
      const payload = {
        // 兼容旧字段（route 其他逻辑用到）
        maleName: maleData.name,
        maleBirthDate: maleData.birthDate,
        maleBirthHour: birthHourCode(maleData),
        femaleName: femaleData.name,
        femaleBirthDate: femaleData.birthDate,
        femaleBirthHour: birthHourCode(femaleData),
        // 新增高精度字段
        male: {
          name: maleData.name,
          gender: maleData.gender,
          isLunar: maleData.isLunar,
          birthDate: maleData.birthDate,
          knowTime: maleData.knowTime,
          birthHourNum: maleData.birthHourNum,
          birthMinute: maleData.birthMinute,
          lateZiShi: maleData.lateZiShi,
          birthPlace: maleData.birthPlace,
        },
        female: {
          name: femaleData.name,
          gender: femaleData.gender,
          isLunar: femaleData.isLunar,
          birthDate: femaleData.birthDate,
          knowTime: femaleData.knowTime,
          birthHourNum: femaleData.birthHourNum,
          birthMinute: femaleData.birthMinute,
          lateZiShi: femaleData.lateZiShi,
          birthPlace: femaleData.birthPlace,
        },
      };

      const res = await fetch('/api/bazi/marriage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 统一 AI 门禁：游客被拦→弹登录，登录未订阅被配额拦→弹升级
        if (gate.handle(res.status, data.code || data.error)) {
          setLoading(false);
          return;
        }
        // 优先显示服务端友好文案（message），避免把 QUOTA_EXCEEDED 等错误码直接抛给用户
        throw new Error(data.message || data.error || '请求失败');
      }

      const data = await res.json();
      setAiAnalysis(null);  // 新查询，清空上次 AI 分析缓存
      setResult(data);
      setLastPayload(payload);
      track('tool_ai_complete', { tool: 'marriage', duration_ms: Date.now() - startTime });
      track('marriage_result_view', { tool: 'marriage' });
      try {
        const cache: MarriageCache = {
          maleData,
          femaleData,
          result: data,
          payload,
          aiAnalysis: undefined,  // 新查询时不保留旧 AI 分析
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(MARRIAGE_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // 忽略 localStorage 写入失败（如配额超限或隐身模式）
      }
    } catch (err) {
      track('tool_ai_error', { tool: 'marriage', error_type: 'api_error' });
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] flex flex-col">
      <div className="pb-20">
        <div className="pt-12 pb-10 text-center px-4">
          <h1 className="font-display text-h1 md:text-[44px] text-[#1C1A16]" style={{ letterSpacing: '10px' }}>
            八字合婚
          </h1>
          <p className="mt-3 text-base text-[#1C1A16]/70">
            智能分析双方八字契合度，提供姻缘参考
          </p>
        </div>

        <Container>
          <div className="space-y-12 px-4 md:px-0">
            {!result && (
              <form onSubmit={handleSubmit} className="space-y-10 max-w-page mx-auto w-full">
                <div className="grid gap-6 md:grid-cols-2">
                  <SideForm sideKey="male" data={maleData} onChange={updateMale} />
                  <SideForm sideKey="female" data={femaleData} onChange={updateFemale} />
                </div>

                {error && (
                  <div className="rounded-xl border border-[#E5484D]/30 bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  {loading ? '正在分析…' : '开始合婚测算'}
                </Button>

                <div className="grid gap-4 md:grid-cols-3">
                  {valueCards.map(card => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="rounded-2xl border border-[#E5E0D8] bg-white p-6"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-[#1C1A16]" />
                        </div>
                        <p className="text-base font-semibold text-[#1C1A16]">{card.title}</p>
                        <p className="mt-1.5 text-sm text-[#1C1A16]/65 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 md:p-7">
                    <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-5">
                      ✨ AI 智能合婚系统
                    </h3>
                    <div className="space-y-5 text-sm">
                      <div>
                        <p className="font-semibold text-[#1C1A16]">传统命理智慧</p>
                        <p className="text-[#1C1A16]/70 mt-1">结合八字、五行、十神、神煞等多重信息</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">AI 深度分析</p>
                        <p className="text-[#1C1A16]/70 mt-1">以语言模型多角度评估双方互动与成长空间</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">匹配度评级</p>
                        <p className="text-[#1C1A16]/70 mt-1">输出基础契合、性格相容、婚配宫位等维度等级</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">改善建议</p>
                        <p className="text-[#1C1A16]/70 mt-1">提供沟通、造势与化解策略</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E5E0D8] bg-[#F7F3EC]/60 p-6 md:p-7">
                    <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-5">
                      📊 合婚分析维度
                    </h3>
                    <div className="space-y-3 text-sm">
                      {dimensionList.map(item => (
                        <div
                          key={item.title}
                          className="rounded-xl bg-white/70 px-4 py-3"
                        >
                          <p className="font-semibold text-[#1C1A16]">{item.title}</p>
                          <p className="text-[#1C1A16]/65 mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Card
                  hover={false}
                  className="rounded-2xl border border-[#E5E0D8] bg-white shadow-none p-6 md:p-8"
                >
                  <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-7">
                    📝 分析流程
                  </h3>
                  <div className="flex flex-col md:flex-row items-stretch gap-5 text-sm text-[#1C1A16]/70">
                    {[
                      { title: '填写出生信息', desc: '录入双方姓名、性别、阳历/农历日期、时分等' },
                      { title: '排盘生成', desc: '系统自动计算双方八字命盘（含真太阳时校正）' },
                      { title: 'AI 深入解读', desc: '四维度智能匹配与风险提示' },
                      { title: '获取完整报告', desc: '查看匹配度、八字与建议' },
                    ].map((step, index) => (
                      <div key={step.title} className="flex flex-1 flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-full border border-[#D8D2C8] text-[#1C1A16]/40 flex items-center justify-center mb-3 text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-base text-[#1C1A16] font-medium">{step.title}</p>
                        <p className="mt-1.5 text-xs text-[#1C1A16]/60 leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </form>
            )}

            {result && (
              <div className="space-y-8 max-w-6xl mx-auto w-full">
                {/* 重新填写入口 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setResult(null)}
                    className="flex items-center gap-1.5 text-sm text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    重新填写
                  </button>
                </div>
                {/* 双方信息确认卡 */}
                <Card hover={false} className="rounded-2xl border border-[#E5E0D8] bg-white shadow-none p-6 md:p-8">
                  <div className="text-center mb-6">
                    <p className="text-xs text-[#1C1A16]/55 tracking-wide">✓ 已提交分析信息</p>
                    <h3
                      className="text-xl md:text-2xl font-semibold text-[#1C1A16] mt-1.5"
                      style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
                    >
                      合婚信息确认
                    </h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { side: maleData, sideLabel: '男方' },
                      { side: femaleData, sideLabel: '女方' },
                    ].map(({ side, sideLabel }) => (
                      <div
                        key={sideLabel}
                        className="rounded-xl border border-[#E5E0D8] bg-[#FAF9F6]/70 p-5"
                      >
                        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#1C1A16]/8">
                          <span className="w-7 h-7 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-[#1C1A16]" />
                          </span>
                          <span className="text-sm font-semibold text-[#1C1A16] tracking-wide">
                            {sideLabel}
                          </span>
                        </div>
                        <dl className="space-y-2.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-[#1C1A16]/55">姓名</dt>
                            <dd className="text-[#1C1A16] font-medium text-right">
                              {side.name || <span className="text-[#1C1A16]/40">未填写</span>}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-[#1C1A16]/55">性别</dt>
                            <dd className="text-[#1C1A16] font-medium text-right">
                              {side.gender === 'male' ? '男' : '女'}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-[#1C1A16]/55">出生日期</dt>
                            <dd className="text-[#1C1A16] font-medium text-right">
                              {side.birthDate || <span className="text-[#1C1A16]/40">未填写</span>}
                              {side.birthDate && (
                                <span className="ml-1 text-xs text-brand-gray">
                                  （{side.isLunar ? '农历' : '阳历'}）
                                </span>
                              )}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-[#1C1A16]/55">出生时间</dt>
                            <dd className="text-[#1C1A16] font-medium text-right">
                              {side.knowTime ? (
                                <>
                                  {String(side.birthHourNum).padStart(2, '0')}:
                                  {String(side.birthMinute).padStart(2, '0')}
                                  <span className="ml-1 text-xs text-[#1C1A16]/55">
                                    （{SHICHEN_BY_HOUR[side.birthHourNum]}）
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#1C1A16]/40">未知</span>
                              )}
                            </dd>
                          </div>
                          {side.birthPlace && (
                            <div className="flex justify-between gap-3">
                              <dt className="text-[#1C1A16]/55">出生地</dt>
                              <dd className="text-[#1C1A16] font-medium text-right">
                                {side.birthPlace}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 模块 A：八字命盘（双方四柱表格） */}
                {result.male?.pillars && result.female?.pillars && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2
                        className="text-2xl md:text-3xl font-semibold text-[#1C1A16]"
                        style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
                      >
                        八字命盘
                      </h2>
                      <p className="text-xs text-[#1C1A16]/55 mt-1">双方四柱天干地支与五行属性</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <PillarTable
                        chart={result.male.pillars}
                        title={`男方 · ${result.male.name || '男方'}`}
                        subtitle={`日主 ${result.male.dayMaster || ''} · 生肖${result.male.zodiac || ''}`}
                      />
                      <PillarTable
                        chart={result.female.pillars}
                        title={`女方 · ${result.female.name || '女方'}`}
                        subtitle={`日主 ${result.female.dayMaster || ''} · 生肖${result.female.zodiac || ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* 模块 B：五行分布雷达图 */}
                {result.male?.wuxing && result.female?.wuxing && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2
                        className="text-2xl md:text-3xl font-semibold text-[#1C1A16]"
                        style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
                      >
                        五行分布
                      </h2>
                      <p className="text-xs text-[#1C1A16]/55 mt-1">木火土金水五维结构对照</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 md:p-6 flex flex-col items-center">
                        <p className="text-sm font-semibold text-[#1C1A16] mb-3">
                          男方 · {result.male.name || '男方'}
                        </p>
                        <RadarChart wuxing={result.male.wuxing} size={240} />
                      </div>
                      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 md:p-6 flex flex-col items-center">
                        <p className="text-sm font-semibold text-[#1C1A16] mb-3">
                          女方 · {result.female.name || '女方'}
                        </p>
                        <RadarChart wuxing={result.female.wuxing} size={240} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 模块 C/D：男女十神分析（桌面 md+ 男左女右并排，移动端竖堆不变） */}
                {((result.male?.shishen && result.male?.shishenSummary) ||
                  (result.female?.shishen && result.female?.shishenSummary)) && (
                  <div className="grid gap-8 md:gap-4 md:grid-cols-2">
                    {/* 模块 C：男方十神分析 */}
                    {result.male?.shishen && result.male?.shishenSummary && (
                      <ShishenSection
                        title="男方十神分析"
                        subtitle="男方八字中的主要十神关系（按四柱展开）"
                        side={result.male.shishen}
                        summary={result.male.shishenSummary}
                      />
                    )}

                    {/* 模块 D：女方十神分析 */}
                    {result.female?.shishen && result.female?.shishenSummary && (
                      <ShishenSection
                        title="女方十神分析"
                        subtitle="女方八字中的主要十神关系（按四柱展开）"
                        side={result.female.shishen}
                        summary={result.female.shishenSummary}
                      />
                    )}
                  </div>
                )}

                {/* 模块 E：AI 合婚分析（按需触发） */}
                {lastPayload && (
                  <AIAnalysisSection
                    key={JSON.stringify(lastPayload)}
                    payload={lastPayload}
                    totalScore={Number(result.score) || 0}
                    initialData={aiAnalysis}
                    onAnalysisDone={handleAIAnalysisDone}
                  />
                )}

                {/* 模块 F：AI 问答 */}
                {result.maleBazi && result.femaleBazi && (
                  <AIQASection
                    maleBazi={result.maleBazi}
                    femaleBazi={result.femaleBazi}
                    maleName={result.male?.name || maleData.name || '男方'}
                    femaleName={result.female?.name || femaleData.name || '女方'}
                    score={Number(result.score) || 0}
                    level={String(result.level || '')}
                  />
                )}

                <p className="text-xs text-brand-gray leading-relaxed text-center px-2">
                  {result.disclaimer}
                </p>
              </div>
            )}
          </div>
        </Container>
      </div>
      <AiGateModals gate={gate} callbackUrl="/bazi/marriage" />
    </div>
  );
}

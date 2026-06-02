'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, HeartPulse, Sparkles, ScrollText, Compass, History, ChevronDown } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { CitySearch } from '@/components/ui/CitySearch';
import { Footer } from '@/components/layout/Footer';
import { loadRecords } from '@/lib/utils/history';
import type { BaziHistoryRecord } from '@/lib/bazi/types';

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
  const accent = isMale ? '👨' : '👩';
  const sideTitle = isMale ? '男方' : '女方';

  const handleHistoryPick = (record: BaziHistoryRecord) => {
    onChange({
      name: record.name || data.name,
      gender: record.gender === 'female' ? 'female' : record.gender === 'male' ? 'male' : data.gender,
      birthDate: record.birthDate || data.birthDate,
      birthPlace: record.birthPlace || data.birthPlace,
    });
  };

  const inputClass =
    'w-full h-10 rounded-lg border border-[#E5E0D8] bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#C2762B] focus:ring-2 focus:ring-[#C2762B]/15 outline-none transition-all';

  return (
    <Card
      hover={false}
      className="rounded-2xl border border-[#E5E0D8] bg-white shadow-none p-6 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-xl">
            {accent}
          </div>
          <div>
            <p className="text-xs text-[#1C1A16]/60">{sideTitle}信息</p>
            <h3 className="text-base font-semibold text-[#1C1A16]">{sideTitle}出生资料</h3>
          </div>
        </div>
        <HistoryFillButton onPick={handleHistoryPick} />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1C1A16]/70">
            姓名 <span className="text-xs text-[#1C1A16]/40">（选填）</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={`请输入${sideTitle}姓名`}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1C1A16]/70">性别</label>
          <SegmentControl
            options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
            ]}
            value={data.gender}
            onChange={(value) => onChange({ gender: value as 'male' | 'female' })}
            className="h-10 rounded-lg overflow-hidden"
            optionClassName="px-3 py-0 h-full flex items-center justify-center text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1C1A16]/70">日期类型</label>
          <SegmentControl
            options={[
              { value: 'solar', label: '阳历' },
              { value: 'lunar', label: '农历' },
            ]}
            value={data.isLunar ? 'lunar' : 'solar'}
            onChange={(value) => onChange({ isLunar: value === 'lunar' })}
            className="h-10 rounded-lg overflow-hidden"
            optionClassName="px-3 py-0 h-full flex items-center justify-center text-sm"
          />
        </div>

        <DatePicker
          label={data.isLunar ? '出生日期（农历）' : '出生日期（阳历）'}
          value={data.birthDate}
          onChange={(value) => onChange({ birthDate: value })}
          className="space-y-2"
          triggerClassName="h-10 rounded-lg"
        />

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1C1A16]">知道精确出生时间</span>
              <span className="text-xs text-[#1C1A16]/45 mt-0.5">
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
                className="w-11 h-6 rounded-full bg-[#E5E0D8] transition-colors duration-200 peer-checked:bg-[#C2762B]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
              />
            </span>
          </label>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              data.knowTime ? 'max-h-[260px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="时（小时）"
                  options={hourOptions}
                  value={String(data.birthHourNum)}
                  onChange={(e) => onChange({ birthHourNum: Number(e.target.value) })}
                  className="h-10 rounded-lg border border-[#E5E0D8] bg-white px-3 text-sm text-[#1C1A16]"
                />
                <Select
                  label="分"
                  options={minuteOptions}
                  value={String(data.birthMinute)}
                  onChange={(e) => onChange({ birthMinute: Number(e.target.value) })}
                  className="h-10 rounded-lg border border-[#E5E0D8] bg-white px-3 text-sm text-[#1C1A16]"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.lateZiShi}
                  onChange={(e) => onChange({ lateZiShi: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-[#C2762B]"
                />
                <div>
                  <p className="text-sm font-medium text-[#1C1A16]">晚子时（23:00 后归次日日柱）</p>
                  <p className="text-xs text-[#1C1A16]/45 mt-0.5">
                    专业命理项，仅当出生在 23:00-23:59 时影响日柱。
                  </p>
                </div>
              </label>
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
      </div>
    </Card>
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

export default function MarriagePage() {
  const [maleData, setMaleData] = useState<SideData>(() => makeDefaultSide('male'));
  const [femaleData, setFemaleData] = useState<SideData>(() => makeDefaultSide('female'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const updateMale = (patch: Partial<SideData>) => setMaleData(prev => ({ ...prev, ...patch }));
  const updateFemale = (patch: Partial<SideData>) => setFemaleData(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!maleData.birthDate || !femaleData.birthDate) {
      setError('请填写双方出生日期');
      return;
    }

    setLoading(true);
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
        const data = await res.json();
        throw new Error(data.error || '请求失败');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <div className="flex-1 pb-20">
        <div className="pt-12 pb-10 text-center px-4">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#1C1A16]/10 bg-white/80 text-sm text-[#1C1A16]/70">
            <HeartPulse className="w-4 h-4 text-[#B7152A]" />
            <span>AI 八字合婚</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-[40px] font-semibold text-[#1C1A16] tracking-wide">
            八字合婚分析
          </h1>
          <p className="mt-3 text-base text-[#1C1A16]/70">
            输入双方出生信息，了解缘分契合度与婚姻走势
          </p>
        </div>

        <Container>
          <div className="max-w-6xl mx-auto space-y-12 px-4 md:px-0">
            {!result && (
              <form onSubmit={handleSubmit} className="space-y-10">
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
                          <Icon className="w-5 h-5 text-[#C2762B]" />
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
                      🔮 AI 智能合婚系统
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
                        <div className="w-9 h-9 rounded-full border border-[#C2762B]/40 text-[#C2762B] flex items-center justify-center mb-3 text-sm font-medium">
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
              <div className="space-y-6">
                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1C1A16]/10 bg-[#FAF9F6] text-sm text-[#1C1A16]/70">
                      <HeartPulse className="w-4 h-4 text-[#B7152A]" />
                      <span>综合匹配度</span>
                    </div>
                    <div className="text-5xl font-semibold text-[#1C1A16]">{result.score}</div>
                    <div className="flex items-center gap-2 text-[#B7152A]">
                      <Heart className="w-6 h-6" fill="#B7152A" stroke="#B7152A" />
                      <span className="text-2xl font-semibold">{result.hearts}</span>
                    </div>
                    <p className="text-sm text-[#1C1A16]/70">{result.level}</p>
                  </div>
                </Card>

                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <h3 className="text-lg font-semibold text-[#1C1A16] mb-4">双方八字命盘</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4">
                      <p className="text-sm text-[#1C1A16]/70 mb-2">男方八字</p>
                      <p className="font-mono text-lg text-[#1C1A16] whitespace-pre-wrap">{result.maleBazi}</p>
                    </div>
                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4">
                      <p className="text-sm text-[#1C1A16]/70 mb-2">女方八字</p>
                      <p className="font-mono text-lg text-[#1C1A16] whitespace-pre-wrap">{result.femaleBazi}</p>
                    </div>
                  </div>
                </Card>

                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HeartPulse className="w-5 h-5 text-[#B7152A]" />
                    <h3 className="text-lg font-semibold text-[#1C1A16]">AI 合婚分析</h3>
                  </div>
                  <p className="text-sm leading-7 text-[#1C1A16]/80 whitespace-pre-wrap">
                    {result.analysis}
                  </p>
                </Card>

                <Button onClick={() => setResult(null)} variant="secondary" className="w-full">
                  重新测算
                </Button>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Footer />
    </div>
  );
}

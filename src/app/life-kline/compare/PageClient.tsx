'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AlertTriangle, ArrowRight, Heart, ImageDown, Share2, Users } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Button } from '@/components/ui/Button';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { loadBirthInfo } from '@/lib/utils/storage';
import { track } from '@/lib/analytics';
import type { LifeKlineResult } from '@/lib/bazi/lifeKline';

const cardClass = 'rounded-2xl border border-[#1C1A16]/8 shadow-none bg-white';

const A_COLOR = '#059669';
const B_COLOR = '#1D4ED8';

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const SHICHEN_OPTIONS = [
  { value: '-1', label: '不知道' },
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
];

function shichenToHour(idx: number): number | undefined {
  if (idx < 0 || idx > 11) return undefined;
  return idx === 0 ? 0 : idx * 2;
}

interface PersonInput {
  birthDate: string;
  birthHour: string;
  gender: string;
}

interface CompareStats {
  /** 年度涨跌方向一致率（%），基于重叠年份 */
  syncPct: number;
  /** 最同步的十年（重叠区间内一致数最多的滑动窗口） */
  bestWindow: { startYear: number; endYear: number } | null;
  /** 运势交叉年（两线高低易位的年份，最多 5 个） */
  crossYears: number[];
  overlap: { startYear: number; endYear: number; count: number };
}

function computeCompareStats(a: LifeKlineResult, b: LifeKlineResult): CompareStats | null {
  const mapB = new Map(b.points.map((p) => [p.year, p.close]));
  const overlap: { year: number; ac: number; bc: number }[] = [];
  for (const p of a.points) {
    const bc = mapB.get(p.year);
    if (bc !== undefined) overlap.push({ year: p.year, ac: p.close, bc });
  }
  if (overlap.length < 10) return null;

  const dirs: { year: number; same: boolean; counted: boolean }[] = [];
  let agree = 0;
  let total = 0;
  for (let i = 1; i < overlap.length; i++) {
    const da = Math.sign(overlap[i].ac - overlap[i - 1].ac);
    const db = Math.sign(overlap[i].bc - overlap[i - 1].bc);
    const counted = da !== 0 && db !== 0;
    const same = counted && da === db;
    if (counted) {
      total++;
      if (same) agree++;
    }
    dirs.push({ year: overlap[i].year, same, counted });
  }
  const syncPct = total ? Math.round((agree / total) * 100) : 0;

  let bestWindow: CompareStats['bestWindow'] = null;
  let bestCount = -1;
  for (let s = 0; s + 10 <= dirs.length; s++) {
    const count = dirs.slice(s, s + 10).filter((d) => d.same).length;
    if (count > bestCount) {
      bestCount = count;
      bestWindow = { startYear: dirs[s].year, endYear: dirs[s + 9].year };
    }
  }

  const crossYears: number[] = [];
  for (let i = 1; i < overlap.length; i++) {
    const prev = Math.sign(overlap[i - 1].ac - overlap[i - 1].bc);
    const cur = Math.sign(overlap[i].ac - overlap[i].bc);
    if (prev !== 0 && cur !== 0 && prev !== cur) crossYears.push(overlap[i].year);
  }

  return {
    syncPct,
    bestWindow,
    crossYears: crossYears.slice(0, 5),
    overlap: {
      startYear: overlap[0].year,
      endYear: overlap[overlap.length - 1].year,
      count: overlap.length,
    },
  };
}

/** 双人收盘线叠加图（按公历年对齐） */
function CompareChart({ a, b, labels }: { a: LifeKlineResult; b: LifeKlineResult; labels: [string, string] }) {
  const W = 1000;
  const H = 320;
  const PAD = { top: 16, right: 16, bottom: 34, left: 40 };

  const { pathA, pathB, ticks, yTicks } = useMemo(() => {
    const minYear = Math.min(a.points[0].year, b.points[0].year);
    const maxYear = Math.max(a.points[a.points.length - 1].year, b.points[b.points.length - 1].year);
    const x = (year: number) => PAD.left + ((year - minYear) / (maxYear - minYear || 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - v / 100) * (H - PAD.top - PAD.bottom);
    const path = (r: LifeKlineResult) =>
      r.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)},${y(p.close).toFixed(1)}`).join('');
    const tickYears: number[] = [];
    for (let yr = Math.ceil(minYear / 20) * 20; yr <= maxYear; yr += 20) tickYears.push(yr);
    return {
      pathA: path(a),
      pathB: path(b),
      ticks: tickYears.map((yr) => ({ year: yr, px: x(yr) })),
      yTicks: [0, 25, 50, 75, 100].map((v) => ({ v, py: y(v) })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b]);

  return (
    <div>
      <div className="flex items-center justify-center gap-5 text-xs text-[#1C1A16]/60 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ background: A_COLOR }} />
          {labels[0]}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ background: B_COLOR }} />
          {labels[1]}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="双人运势曲线对比图">
        {yTicks.map((t) => (
          <g key={t.v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.py} y2={t.py} stroke="#1C1A16" strokeOpacity={0.06} strokeWidth={1} />
            <text x={PAD.left - 8} y={t.py + 3.5} textAnchor="end" fontSize={11} fill="#1C1A16" fillOpacity={0.45}>
              {t.v}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t.year} x={t.px} y={H - 12} textAnchor="middle" fontSize={11} fill="#1C1A16" fillOpacity={0.5}>
            {t.year}
          </text>
        ))}
        <path d={pathA} fill="none" stroke={A_COLOR} strokeWidth={1.8} strokeOpacity={0.9} />
        <path d={pathB} fill="none" stroke={B_COLOR} strokeWidth={1.8} strokeOpacity={0.9} />
      </svg>
    </div>
  );
}

/** 双人分享卡弹层 */
function CompareShareDialog({
  open,
  onClose,
  a,
  b,
  stats,
}: {
  open: boolean;
  onClose: () => void;
  a: LifeKlineResult;
  b: LifeKlineResult;
  stats: CompareStats | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL('https://www.cyberfate.me/life-kline/compare?ref=share', {
      width: 144,
      margin: 1,
      color: { dark: '#1C1A16', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  const title = stats?.crossYears.length
    ? `我们的运势在 ${stats.crossYears[0]} 年交汇`
    : stats
      ? `我们的运势同频指数 ${stats.syncPct}%`
      : '我们的人生K线';

  const thumb = useMemo(() => {
    const W = 292;
    const H = 100;
    const PAD = 6;
    const minYear = Math.min(a.points[0].year, b.points[0].year);
    const maxYear = Math.max(a.points[a.points.length - 1].year, b.points[b.points.length - 1].year);
    const x = (year: number) => PAD + ((year - minYear) / (maxYear - minYear || 1)) * (W - PAD * 2);
    const y = (v: number) => PAD + (1 - v / 100) * (H - PAD * 2);
    const path = (r: LifeKlineResult) =>
      r.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)},${y(p.close).toFixed(1)}`).join('');
    return { w: W, h: H, pa: path(a), pb: path(b) };
  }, [a, b]);

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#FFFFFF', pixelRatio: 3 });
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = '人生K线合盘.png';
      anchor.click();
      track('kline_compare_share', {});
    } catch {
      setError('图片生成失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="分享合盘对比" size="md">
      <div className="flex flex-col items-center">
        <div
          ref={cardRef}
          className="bg-white border border-[#1C1A16]/10 rounded-2xl overflow-hidden flex flex-col shrink-0"
          style={{ width: 340, height: 453 }}
        >
          <div className="flex-1 flex flex-col px-6 pt-6 pb-5">
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: A_COLOR }} />
              <span className="text-[11px] font-medium tracking-[0.14em] text-[#1C1A16]/55">
                赛博命理师 · 人生K线合盘
              </span>
            </div>
            <h3 className="mt-3 font-display text-[21px] leading-snug font-bold text-[#1C1A16]">{title}</h3>
            <p className="mt-1.5 text-[11px] text-[#1C1A16]/45">
              {a.meta.dayMaster}命 × {b.meta.dayMaster}命 · 两条百年曲线的对照
            </p>

            <div className="mt-4">
              <svg viewBox={`0 0 ${thumb.w} ${thumb.h}`} className="w-full" aria-hidden>
                <path d={thumb.pa} fill="none" stroke={A_COLOR} strokeWidth="1.5" />
                <path d={thumb.pb} fill="none" stroke={B_COLOR} strokeWidth="1.5" />
              </svg>
              <div className="mt-1 flex justify-center gap-4 text-[10px] text-[#1C1A16]/45">
                <span style={{ color: A_COLOR }}>— 我</span>
                <span style={{ color: B_COLOR }}>— TA</span>
              </div>
            </div>

            {stats && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                  <p className="text-[10px] text-[#1C1A16]/50">同频指数</p>
                  <p className="mt-0.5 text-[13px] font-semibold" style={{ color: A_COLOR }}>
                    {stats.syncPct}%
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                  <p className="text-[10px] text-[#1C1A16]/50">最同步十年</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#1C1A16]">
                    {stats.bestWindow ? `${stats.bestWindow.startYear}-${String(stats.bestWindow.endYear).slice(2)}` : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                  <p className="text-[10px] text-[#1C1A16]/50">交汇年</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#1C1A16]">
                    {stats.crossYears[0] ?? '—'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-3 pt-3 border-t border-[#1C1A16]/6">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="二维码" className="w-12 h-12 rounded" style={{ imageRendering: 'pixelated' }} />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#1C1A16]/70">扫码对比你们的人生K线</p>
                <p className="text-[10px] text-[#1C1A16]/45">CyberFate.me</p>
                <p className="mt-0.5 text-[9px] leading-tight text-[#1C1A16]/35">
                  仅供参考与娱乐 · 人生走向取决于你们的选择与努力
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent text-white font-semibold tracking-[0.08em] text-sm px-4 py-2.5 hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
        >
          <ImageDown className="w-4 h-4" strokeWidth={1.5} />
          {saving ? '生成中...' : '保存分享卡'}
        </button>
      </div>
    </Modal>
  );
}

function PersonForm({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  error?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[#1C1A16] mb-3">{label}</p>
      <div className="flex flex-col gap-3">
        <DatePicker
          value={value.birthDate}
          onChange={(v) => onChange({ ...value, birthDate: v })}
          label="出生日期"
          triggerClassName={
            error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200' : 'border-[#E8E4DD] focus:border-brand-accent'
          }
        />
        <Select
          label="出生时辰"
          value={value.birthHour}
          onChange={(e) => onChange({ ...value, birthHour: e.target.value })}
          options={SHICHEN_OPTIONS}
          className="border-[#E8E4DD] focus:border-brand-accent"
        />
        <div>
          <label className="block text-sm font-medium text-[#1C1A16] mb-2">性别</label>
          <SegmentControl options={GENDER_OPTIONS} value={value.gender} onChange={(g) => onChange({ ...value, gender: g })} />
        </div>
      </div>
    </div>
  );
}

async function fetchKline(p: PersonInput): Promise<LifeKlineResult> {
  const hourNum = shichenToHour(Number(p.birthHour));
  const res = await fetch('/api/life-kline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gender: p.gender,
      birthDate: p.birthDate,
      knowTime: hourNum !== undefined,
      birthHourNum: hourNum,
      birthMinute: hourNum !== undefined ? 0 : undefined,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) throw new Error(body.error || `请求失败 (${res.status})`);
  return body.data as LifeKlineResult;
}

export default function LifeKlineComparePage() {
  const [personA, setPersonA] = useState<PersonInput>({ birthDate: '1990-06-15', birthHour: '4', gender: 'male' });
  const [personB, setPersonB] = useState<PersonInput>({ birthDate: '1992-03-08', birthHour: '-1', gender: 'female' });
  const [errors, setErrors] = useState<{ a?: boolean; b?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<{ a: LifeKlineResult; b: LifeKlineResult } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // A 默认带入本人已存信息；B 方信息只在本次会话内使用，不落库不写 storage（PRD §8 隐私）
  useEffect(() => {
    const saved = loadBirthInfo();
    if (saved?.birthDate) {
      setPersonA({
        birthDate: saved.birthDate,
        birthHour: saved.birthHour ?? '4',
        gender: saved.gender === 'female' ? 'female' : 'male',
      });
    }
  }, []);

  const handleSubmit = async () => {
    const newErrors = { a: !personA.birthDate, b: !personB.birthDate };
    setErrors(newErrors);
    if (newErrors.a || newErrors.b) return;
    setLoading(true);
    setError(null);
    track('kline_compare_generate', {});
    try {
      const [a, b] = await Promise.all([fetchKline(personA), fetchKline(personB)]);
      setPair({ a, b });
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => (pair ? computeCompareStats(pair.a, pair.b) : null), [pair]);

  return (
    <div className="min-h-dvh bg-[#FAF9F6]">
      <PageShell width="wide" className="pt-16 md:pt-24 pb-6 md:pb-8">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em]"
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            双人运势对比
          </span>
          <h1 className="mt-4 font-display text-3xl md:text-[40px] font-bold text-[#1C1A16] leading-tight">
            人生K线 · 合盘对比
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#1C1A16]/55 tracking-wider">
            把两个人的百年曲线叠在同一张图上 · 看你们何时同频、何处交汇
          </p>
        </div>
      </PageShell>

      <PageShell width="wide" className="pb-6 md:pb-8">
        <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <PersonForm label="我" value={personA} onChange={setPersonA} error={errors.a} />
            <div className="hidden md:flex items-center">
              <Heart className="w-5 h-5 text-[#1C1A16]/20" strokeWidth={1.5} />
            </div>
            <PersonForm label="TA" value={personB} onChange={setPersonB} error={errors.b} />
          </div>
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
            <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading} className="w-full sm:w-auto">
              生成对比
            </Button>
            <p className="text-xs text-[#1C1A16]/40">TA 的出生信息仅用于本次计算，不会被保存。</p>
          </div>
        </div>
      </PageShell>

      {error && (
        <PageShell width="wide" className="pb-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </PageShell>
      )}

      {loading && !pair && (
        <PageShell width="wide" className="pb-10">
          <div className="flex flex-col items-center justify-center py-16">
            <BaguaSpinner />
            <p className="mt-4 text-sm text-[#1C1A16]/50">正在推演两条百年曲线...</p>
          </div>
        </PageShell>
      )}

      {pair && (
        <PageShell width="wide" className="pb-12 md:pb-16">
          <div className="flex flex-col gap-4 md:gap-6">
            <Card className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">双人运势曲线</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/60 hover:text-[#1C1A16] border border-[#1C1A16]/15 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  分享
                </button>
              </div>
              <CompareChart
                a={pair.a}
                b={pair.b}
                labels={[`我（${pair.a.meta.dayMaster}命）`, `TA（${pair.b.meta.dayMaster}命）`]}
              />
              <p className="mt-4 text-[11px] leading-relaxed text-[#1C1A16]/40">
                本对比基于传统命理推算，仅供参考与娱乐。关系的走向取决于两个人的经营与选择。
              </p>
            </Card>

            {stats && (
              <Card className={cardClass}>
                <div className="flex items-center gap-2 mb-4">
                  <span aria-hidden className="pointer-events-none w-1 h-4 rounded inline-block" style={{ background: '#059669' }} />
                  <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.08em]">同频报告</h2>
                  <span className="text-sm text-[#1C1A16]/50">
                    重叠区间 {stats.overlap.startYear}-{stats.overlap.endYear}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-xs text-[#1C1A16]/50">同频指数</p>
                    <p className="text-2xl font-semibold mt-1" style={{ color: A_COLOR }}>
                      {stats.syncPct}%
                    </p>
                    <p className="text-xs text-[#1C1A16]/45">年度涨跌方向一致的比例</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#1C1A16]/50">最同步的十年</p>
                    <p className="text-2xl font-semibold text-[#1C1A16] mt-1">
                      {stats.bestWindow ? `${stats.bestWindow.startYear}-${stats.bestWindow.endYear}` : '—'}
                    </p>
                    <p className="text-xs text-[#1C1A16]/45">起落节奏最接近的窗口</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#1C1A16]/50">运势交叉年</p>
                    <p className="text-2xl font-semibold text-[#1C1A16] mt-1">
                      {stats.crossYears.length ? stats.crossYears.join(' · ') : '暂无'}
                    </p>
                    <p className="text-xs text-[#1C1A16]/45">两条曲线高低易位的年份</p>
                  </div>
                </div>
              </Card>
            )}

            {/* 深度解读导流合婚（付费承接） */}
            <Card className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-[#1C1A16]">想知道你们「合不合」？</h3>
                  <p className="mt-1 text-sm text-[#1C1A16]/60">
                    曲线只看节奏，合婚看契合：五行互补、天干五合、婚姻宫互动的深度报告在合婚配对里。
                  </p>
                </div>
                <Link
                  href="/bazi/marriage"
                  className="inline-flex items-center gap-1 hover:gap-2 transition-all text-sm font-medium shrink-0"
                  style={{ color: '#059669' }}
                >
                  去做合婚深度解读
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </div>
            </Card>
          </div>

          <CompareShareDialog open={shareOpen} onClose={() => setShareOpen(false)} a={pair.a} b={pair.b} stats={stats} />
        </PageShell>
      )}
    </div>
  );
}

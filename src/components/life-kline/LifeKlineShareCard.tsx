'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImageDown } from 'lucide-react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { track } from '@/lib/analytics';
import type { LifeKlineResult, LifeKlineYearPoint } from '@/lib/bazi/lifeKline';

const SHARE_URL = 'https://www.cyberfate.me/life-kline?ref=share';

/** 3:4 竖版，导出时 pixelRatio 3 → 1020×1360 */
const CARD_W = 340;
const CARD_H = 453;

interface ShareInsights {
  title: string;
  /** 下一个上升期起点（无未来上升年份则为 null） */
  nextRise: LifeKlineYearPoint | null;
}

/**
 * 分享卡标题模板：只从正向池选取，任何命盘都有可用表述（PRD §8 表述规范）。
 */
export function deriveShareInsights(result: LifeKlineResult): ShareInsights {
  const { summary, points } = result;
  const currentAge = summary.currentAge;

  const future = currentAge !== null ? points.filter((p) => p.age > currentAge) : [];
  const nextRise =
    future.find((p) => p.level === '极盛' || p.level === '上佳') ??
    (currentAge !== null
      ? future.find((p) => p.close > (points[currentAge - 1]?.close ?? 0)) ?? null
      : null);

  let title: string;
  if (currentAge === null) {
    title = `我的人生巅峰在 ${summary.peak.year} 年（${summary.peak.age} 岁）`;
  } else if (summary.peak.age > currentAge) {
    title = `我的人生巅峰在 ${summary.peak.year} 年，还有 ${summary.peak.year - summary.currentYear} 年`;
  } else if (currentAge >= summary.bestDecade.ageStart && currentAge <= summary.bestDecade.ageEnd) {
    title = `我正走在人生黄金十年（${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁）`;
  } else if (summary.bestDecade.ageStart > currentAge) {
    title = `我的黄金十年从 ${summary.bestDecade.ageStart} 岁开始，正在路上`;
  } else if (nextRise) {
    title = `我的下一个上升期在 ${nextRise.year} 年，已经不远`;
  } else {
    title = `我的黄金十年是 ${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁，稳字当头`;
  }

  return { title, nextRise };
}

/** 收盘线 + MA10 缩略图（纯 SVG，无外部依赖，可被 html-to-image 完整捕获） */
function CurveThumb({ result }: { result: LifeKlineResult }) {
  const W = 292;
  const H = 110;
  const PAD = 6;
  const { points, summary } = result;

  const { closePath, maPath, dot } = useMemo(() => {
    const n = points.length;
    const min = Math.min(...points.map((p) => p.close)) - 4;
    const max = Math.max(...points.map((p) => p.close)) + 4;
    const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
    const y = (v: number) => PAD + (1 - (v - min) / (max - min)) * (H - PAD * 2);

    const closePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join('');
    const maPts = points.filter((p) => p.ma10 !== null);
    const maPath = maPts
      .map((p, j) => `${j === 0 ? 'M' : 'L'}${x(points.indexOf(p)).toFixed(1)},${y(p.ma10 as number).toFixed(1)}`)
      .join('');
    const dot =
      summary.currentAge !== null
        ? { cx: x(summary.currentAge - 1), cy: y(points[summary.currentAge - 1].close) }
        : null;
    return { closePath, maPath, dot };
  }, [points, summary.currentAge]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <path d={`${closePath}L${W - PAD},${H - PAD}L${PAD},${H - PAD}Z`} fill="#059669" opacity="0.06" />
      <path d={closePath} fill="none" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={maPath} fill="none" stroke="#D97706" strokeWidth="1" opacity="0.75" />
      {dot && (
        <>
          <circle cx={dot.cx} cy={dot.cy} r="3.5" fill="#059669" />
          <circle cx={dot.cx} cy={dot.cy} r="6" fill="none" stroke="#059669" strokeWidth="1" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

interface LifeKlineShareDialogProps {
  open: boolean;
  onClose: () => void;
  result: LifeKlineResult;
  birthDate: string;
  /** 次级入口：导出完整K线图（沿用 V1 整卡截图） */
  onExportFull: () => void;
}

export function LifeKlineShareDialog({ open, onClose, result, birthDate, onExportFull }: LifeKlineShareDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(SHARE_URL, {
      width: 144,
      margin: 1,
      color: { dark: '#1C1A16', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  const insights = useMemo(() => deriveShareInsights(result), [result]);
  const { summary, meta } = result;

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#FFFFFF', pixelRatio: 3 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `人生K线分享卡_${birthDate}.png`;
      a.click();
      track('share_card_export', { tool: 'life_kline' });
    } catch {
      setError('图片生成失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="分享我的人生K线" size="md">
      <div className="flex flex-col items-center">
        {/* 分享卡本体（所见即所得，导出即此节点） */}
        <div
          ref={cardRef}
          className="bg-white border border-[#1C1A16]/10 rounded-2xl overflow-hidden flex flex-col shrink-0"
          style={{ width: CARD_W, height: CARD_H }}
        >
          <div className="flex-1 flex flex-col px-6 pt-6 pb-5">
            {/* 品牌行 */}
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: '#059669' }} />
              <span className="text-[11px] font-medium tracking-[0.14em] text-[#1C1A16]/55">
                赛博命理师 · 人生K线
              </span>
            </div>

            {/* 标题 */}
            <h3 className="mt-3 font-display text-[21px] leading-snug font-bold text-[#1C1A16]">
              {insights.title}
            </h3>
            <p className="mt-1.5 text-[11px] text-[#1C1A16]/45 tracking-[0.06em]">
              {meta.fourPillars} · 属{meta.zodiac} · {meta.dayMaster}命
            </p>

            {/* 曲线 */}
            <div className="mt-4">
              <CurveThumb result={result} />
              <div className="mt-1 flex justify-between text-[10px] text-[#1C1A16]/35">
                <span>1岁</span>
                {summary.currentAge !== null && <span style={{ color: '#059669' }}>● 现在 {summary.currentAge}岁</span>}
                <span>100岁</span>
              </div>
            </div>

            {/* 三个数据点 */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                <p className="text-[10px] text-[#1C1A16]/50">最佳十年</p>
                <p className="mt-0.5 text-[13px] font-semibold text-emerald-600">
                  {summary.bestDecade.ageStart}-{summary.bestDecade.ageEnd}岁
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                <p className="text-[10px] text-[#1C1A16]/50">当前阶段</p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#1C1A16]">{summary.currentPhase}</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-2.5 py-2 text-center">
                <p className="text-[10px] text-[#1C1A16]/50">下个上升期</p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#1C1A16]">
                  {insights.nextRise ? `${insights.nextRise.year}年` : '进行中'}
                </p>
              </div>
            </div>

            <div className="flex-1" />

            {/* 底部：二维码 + 落款 + 免责 */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#1C1A16]/6">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="二维码" className="w-12 h-12 rounded" style={{ imageRendering: 'pixelated' }} />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#1C1A16]/70">扫码测你的人生K线</p>
                <p className="text-[10px] text-[#1C1A16]/45">CyberFate.me</p>
                <p className="mt-0.5 text-[9px] leading-tight text-[#1C1A16]/35">
                  仅供参考与娱乐 · 人生走向取决于你的选择与努力
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-4 w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent text-white font-semibold tracking-[0.08em] text-sm px-4 py-2.5 hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
          >
            <ImageDown className="w-4 h-4" strokeWidth={1.5} />
            {saving ? '生成中...' : '保存分享卡'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onExportFull();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#1C1A16]/25 bg-white text-[#1C1A16] text-sm px-4 py-2.5 hover:border-[#1C1A16] hover:bg-[#FDFBF7] transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            导出完整K线图
          </button>
        </div>
      </div>
    </Modal>
  );
}

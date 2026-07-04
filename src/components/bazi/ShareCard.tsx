'use client';

import { useState, useEffect } from 'react';
import { Share2, Download, Check } from 'lucide-react';
import QRCode from 'qrcode';
import type { PillarRecord } from '@/lib/bazi/types';
import { cn } from '@/lib/utils/cn';

interface ShareCardProps {
  pillars: PillarRecord;
  dayMaster: string;
  zodiac: string;
  summary: string;
  /** 是否存在真实时柱；false 时分享卡时柱显示「未知」 */
  hasHour?: boolean;
  className?: string;
}

const CARD_W = 750;
const CARD_H = 1334;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    lines.push(text.slice(i, i + maxChars));
  }
  return lines;
}

async function buildCanvas(baziText: string, dayMaster: string, zodiac: string, summary: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, '#FAF9F6');
  bg.addColorStop(0.5, '#FFFCF5');
  bg.addColorStop(1, '#FEF9E7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1C1A16';

  // Brand title
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('赛博命理师', CARD_W / 2, 160);

  // Subtitle
  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.5)';
  ctx.fillText('CyberFate.me', CARD_W / 2, 200);

  // Section title
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#1C1A16';
  ctx.fillText('我的八字命盘', CARD_W / 2, 380);

  // Bazi text
  ctx.font = 'bold 36px monospace';
  ctx.fillText(baziText, CARD_W / 2, 460);

  // Day master / zodiac
  ctx.font = '28px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.6)';
  ctx.fillText(`日主：${dayMaster}   |   生肖：${zodiac}`, CARD_W / 2, 520);

  // Summary card background
  const cardX = 36;
  const cardY = 580;
  const cardW = CARD_W - 72;
  const summaryLines = wrapText(ctx, summary || '命理特质生成中...', 18);
  const lineH = 44;
  const cardH = 48 + summaryLines.length * lineH;

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(28,26,22,0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#1C1A16';
  summaryLines.forEach((line, i) => {
    ctx.fillText(line, CARD_W / 2, cardY + 40 + i * lineH);
  });

  // Bottom CTA: QR code + label
  const qrSize = 150;
  const qrX = (CARD_W - qrSize) / 2;
  const qrY = CARD_H - 220;

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, 'https://www.cyberfate.me/bazi', {
    width: qrSize,
    margin: 1,
    color: { dark: '#1C1A16', light: '#FAFAF8' },
  });
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.55)';
  ctx.fillText('CyberFate.me', CARD_W / 2, qrY + qrSize + 36);

  return canvas;
}

export function ShareCard({ pillars, dayMaster, zodiac, summary, hasHour = true, className }: ShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL('https://www.cyberfate.me/bazi', {
      width: 120,
      margin: 1,
      color: { dark: '#1C1A16', light: '#FAFAF8' },
    }).then(setQrDataUrl).catch(() => {});
  }, []);

  const hourText = hasHour ? `${pillars.hour.gan}${pillars.hour.zhi}` : '时柱未知';
  const baziText = `${pillars.year.gan}${pillars.year.zhi} ${pillars.month.gan}${pillars.month.zhi} ${pillars.day.gan}${pillars.day.zhi} ${hourText}`;

  const fallbackCopyText = () => {
    const text = `我的八字命盘\n${baziText}\n日主：${dayMaster} | 生肖：${zodiac}\n\n${summary || ''}\n\n访问 CyberFate.me 查看你的命盘`;
    navigator.clipboard.writeText(text).then(() => {
      alert('图片生成失败，已将命盘信息复制到剪贴板');
    }).catch(() => {
      alert('生成失败，请重试');
    });
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberfate-bazi-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await buildCanvas(baziText, dayMaster, zodiac, summary);
      canvas.toBlob((blob) => {
        if (!blob) { fallbackCopyText(); setIsGenerating(false); return; }
        downloadBlob(blob);
        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      fallbackCopyText();
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await buildCanvas(baziText, dayMaster, zodiac, summary);
      canvas.toBlob(async (blob) => {
        if (!blob) { fallbackCopyText(); setIsGenerating(false); return; }
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          downloadBlob(blob);
          alert('您的浏览器不支持复制图片，已为您下载');
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      fallbackCopyText();
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] py-2.5 rounded-xl bg-brand-accent text-white font-medium text-sm transition-all hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? '生成中...' : '下载分享图'}
        </button>
        <button
          type="button"
          onClick={handleCopyImage}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] py-2.5 rounded-xl border border-[#1C1A16]/15 text-[#1C1A16] font-medium text-sm transition-all hover:bg-[#1C1A16]/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? '已复制' : '复制图片'}
        </button>
      </div>

      {/* 分享卡片预览 */}
      <div className="mx-auto overflow-hidden rounded-2xl border border-[#1C1A16]/10" style={{ width: '375px' }}>
        <div
          className="flex flex-col items-center justify-between bg-gradient-to-br from-[#FAF9F6] via-[#FFFCF5] to-[#FEF9E7] py-12 px-6"
          style={{ width: '375px', height: '667px' }}
        >
          {/* 顶部品牌区 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1C1A16] font-display">
              赛博命理师
            </h1>
            <p className="mt-1 text-xs text-[#1C1A16]/50">CyberFate.me</p>
          </div>

          {/* 中间内容区 */}
          <div className="text-center w-full space-y-4">
            <h2 className="text-xl font-semibold text-[#1C1A16]">
              我的八字命盘
            </h2>
            <p className="font-mono text-lg font-semibold tracking-[0.12em] text-[#1C1A16]">
              {baziText}
            </p>
            <p className="text-sm text-[#1C1A16]/60">
              日主：{dayMaster} <span className="mx-2 text-[#1C1A16]/20">|</span> 生肖：{zodiac}
            </p>
            <div className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-[#1C1A16]/10 p-6 shadow-sm">
              <p className="text-base leading-relaxed text-[#1C1A16] text-center">
                {summary || '命理特质生成中...'}
              </p>
            </div>
          </div>

          {/* 底部二维码 */}
          <div className="text-center">
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="mx-auto w-[60px] h-[60px]"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="mt-1.5 text-xs text-[#1C1A16]/50">CyberFate.me</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#1C1A16]/50 text-center">
        分享卡片尺寸：750x1334 (适配朋友圈)
      </p>
    </div>
  );
}

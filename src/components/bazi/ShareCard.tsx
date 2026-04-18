'use client';

import { useState, useRef } from 'react';
import { Share2, Download, Check } from 'lucide-react';
import type { PillarRecord } from '@/lib/bazi/types';
import { cn } from '@/lib/utils/cn';

interface ShareCardProps {
  pillars: PillarRecord;
  dayMaster: string;
  zodiac: string;
  summary: string;
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

function buildCanvas(baziText: string, dayMaster: string, zodiac: string, summary: string): HTMLCanvasElement {
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
  ctx.fillText('我的八字命盘', CARD_W / 2, 340);

  // Bazi text
  ctx.font = 'bold 36px monospace';
  ctx.fillText(baziText, CARD_W / 2, 410);

  // Day master / zodiac
  ctx.font = '28px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.6)';
  ctx.fillText(`日主：${dayMaster}   |   生肖：${zodiac}`, CARD_W / 2, 460);

  // Summary card background
  const cardX = 60;
  const cardY = 520;
  const cardW = CARD_W - 120;
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

  // Bottom CTA box
  const ctaY = CARD_H - 260;
  const ctaW = 320;
  const ctaH = 140;
  const ctaX = (CARD_W - ctaW) / 2;

  ctx.fillStyle = '#1C1A16';
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 20);
  ctx.fill();

  ctx.font = '22px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('访问 CyberFate.me 查看你的命盘', CARD_W / 2, ctaY + 46);

  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('CyberFate.me', CARD_W / 2, ctaY + 92);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('查看你的命盘', CARD_W / 2, ctaY + 126);

  return canvas;
}

export function ShareCard({ pillars, dayMaster, zodiac, summary, className }: ShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const baziText = `${pillars.year.gan}${pillars.year.zhi} ${pillars.month.gan}${pillars.month.zhi} ${pillars.day.gan}${pillars.day.zhi} ${pillars.hour.gan}${pillars.hour.zhi}`;

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
      const canvas = buildCanvas(baziText, dayMaster, zodiac, summary);
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
      const canvas = buildCanvas(baziText, dayMaster, zodiac, summary);
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
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1A16] text-white font-medium text-sm transition-all hover:bg-[#1C1A16]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? '生成中...' : '下载分享图'}
        </button>
        <button
          type="button"
          onClick={handleCopyImage}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#1C1A16]/15 text-[#1C1A16] font-medium text-sm transition-all hover:bg-[#1C1A16]/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? '已复制' : '复制图片'}
        </button>
      </div>

      {/* 分享卡片预览 */}
      <div className="overflow-hidden rounded-2xl border border-[#1C1A16]/10">
        <div
          className="relative bg-gradient-to-br from-[#FAF9F6] via-[#FFFCF5] to-[#FEF9E7]"
          style={{ width: '375px', height: '667px' }}
        >
          {/* 顶部品牌区 */}
          <div className="absolute top-0 left-0 right-0 pt-12 pb-8 text-center">
            <h1 className="text-2xl font-bold text-[#1C1A16] font-display">
              赛博命理师
            </h1>
            <p className="mt-1 text-xs text-[#1C1A16]/50">CyberFate.me</p>
          </div>

          {/* 主标题 */}
          <div className="absolute top-32 left-0 right-0 text-center px-8">
            <h2 className="text-xl font-semibold text-[#1C1A16] mb-3">
              我的八字命盘
            </h2>
            <p className="font-mono text-lg font-semibold tracking-[0.12em] text-[#1C1A16] mb-2">
              {baziText}
            </p>
            <p className="text-sm text-[#1C1A16]/60">
              日主：{dayMaster} <span className="mx-2 text-[#1C1A16]/20">|</span> 生肖：{zodiac}
            </p>
          </div>

          {/* 一句话命运总结 */}
          <div className="absolute top-64 left-0 right-0 px-10">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-[#1C1A16]/10 p-6 shadow-sm">
              <p className="text-base leading-relaxed text-[#1C1A16] text-center">
                {summary || '命理特质生成中...'}
              </p>
            </div>
          </div>

          {/* 底部 CTA */}
          <div className="absolute bottom-16 left-0 right-0 text-center px-8">
            <div className="rounded-xl bg-[#1C1A16] text-white px-6 py-4 inline-block">
              <p className="text-xs text-white/60 mb-1">访问以下网址</p>
              <p className="text-base font-bold tracking-wide">CyberFate.me</p>
              <p className="text-xs text-white/70 mt-1">查看你的命盘</p>
            </div>
          </div>

          {/* 装饰元素 */}
          <div className="absolute top-24 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 blur-2xl" />
          <div className="absolute bottom-32 left-8 w-20 h-20 rounded-full bg-gradient-to-br from-[#22C55E]/20 to-[#3B82F6]/20 blur-2xl" />
        </div>
      </div>

      <p className="text-xs text-[#1C1A16]/50 text-center">
        分享卡片尺寸：750x1334 (适配朋友圈)
      </p>
    </div>
  );
}

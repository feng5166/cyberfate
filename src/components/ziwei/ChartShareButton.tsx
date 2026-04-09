'use client';

import { useState, useCallback, useRef } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import type { PalaceData } from './types';
import { STAR_COLORS } from './types';

interface ChartShareButtonProps {
  palaces: PalaceData[];
  birthInfo?: { date: string; hour: string; gender: string };
}

const GRID_SLOTS: (number | null)[] = [
  1, 2, 3, 4,
  0, null, null, 5,
  11, null, null, 6,
  10, 9, 8, 7,
];

export function ChartShareButton({ palaces, birthInfo }: ChartShareButtonProps) {
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = useCallback(async () => {
    setGenerating(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const dpr = window.devicePixelRatio || 2;
      const W = 800;
      const H = 920;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#FAF9F6';
      ctx.fillRect(0, 0, W, H);

      // Title
      ctx.fillStyle = '#1C1A16';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('紫微斗数命盘', W / 2, 48);

      if (birthInfo) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(28,26,22,0.5)';
        ctx.fillText(
          `${birthInfo.date} · ${birthInfo.gender === 'male' ? '男' : '女'}命`,
          W / 2,
          72,
        );
      }

      // Grid
      const gridTop = 92;
      const cellW = (W - 80) / 4;
      const cellH = 160;
      const gapX = 4;
      const gapY = 4;
      const startX = 40;

      for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const x = startX + col * (cellW + gapX);
        const y = gridTop + row * (cellH + gapY);
        const palaceIdx = GRID_SLOTS[i];

        // Cell background
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, x, y, cellW, cellH, 12);
        ctx.fill();
        ctx.strokeStyle = '#E8E4DD';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, cellW, cellH, 12);
        ctx.stroke();

        if (palaceIdx === null) {
          if (i === 5) {
            ctx.fillStyle = 'rgba(28,26,22,0.06)';
            roundRect(ctx, x, y, cellW * 2 + gapX, cellH * 2 + gapY, 12);
            ctx.fill();
            ctx.fillStyle = '#1C1A16';
            ctx.font = 'bold 18px serif';
            ctx.textAlign = 'center';
            ctx.fillText('CyberFate', x + cellW + gapX / 2, y + cellH - 10);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(28,26,22,0.4)';
            ctx.fillText('赛博命理师', x + cellW + gapX / 2, y + cellH + 12);
          }
          continue;
        }

        const palace = palaces[palaceIdx];
        if (!palace) continue;

        // Palace name
        ctx.fillStyle = 'rgba(28,26,22,0.55)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(palace.name, x + 10, y + 18);

        // Branch
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(28,26,22,0.35)';
        ctx.fillText(`${palace.stem || ''}${palace.branch}`, x + cellW - 10, y + 18);

        // Life tag
        if (palace.isLife) {
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(28,26,22,0.08)';
          roundRect(ctx, x + cellW / 2 - 10, y + 5, 20, 16, 4);
          ctx.fill();
          ctx.fillStyle = 'rgba(28,26,22,0.6)';
          ctx.font = '9px sans-serif';
          ctx.fillText('命', x + cellW / 2, y + 16);
        }

        // Major stars
        ctx.textAlign = 'center';
        let starY = y + 50;
        for (const star of palace.majorStars) {
          const color = STAR_COLORS[star.name] || '#1C1A16';
          // Color dot
          ctx.beginPath();
          ctx.arc(x + cellW / 2 - 20, starY - 3, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          // Star name
          ctx.fillStyle = color;
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(star.name, x + cellW / 2 + 2, starY);
          // Brightness
          if (star.brightness) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = 'rgba(28,26,22,0.4)';
            ctx.fillText(star.brightness, x + cellW / 2 + 28, starY);
          }
          starY += 22;
        }

        if (palace.majorStars.length === 0) {
          ctx.fillStyle = 'rgba(28,26,22,0.15)';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('—', x + cellW / 2, starY);
        }

        // Separator
        if (palace.minorStars.length > 0) {
          const sepY = Math.max(starY + 4, y + cellH - 45);
          ctx.strokeStyle = 'rgba(232,228,221,0.8)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x + 10, sepY);
          ctx.lineTo(x + cellW - 10, sepY);
          ctx.stroke();

          // Minor stars
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          const minorText = palace.minorStars.map((s) => s.name).join(' ');
          ctx.fillStyle = palace.minorStars.some((s) => s.type === 'evil')
            ? 'rgba(220,38,38,0.5)'
            : 'rgba(28,26,22,0.35)';
          ctx.fillText(
            minorText.length > 12 ? minorText.slice(0, 12) + '…' : minorText,
            x + cellW / 2,
            sepY + 16,
          );
        }
      }

      // Watermark
      ctx.fillStyle = 'rgba(28,26,22,0.25)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generated by CyberFate · cyberfate.vercel.app', W / 2, H - 16);

      // Download
      const link = document.createElement('a');
      link.download = `紫微命盘_${birthInfo?.date || 'chart'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  }, [palaces, birthInfo]);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      // Reuse generation logic...
      await generateImage();
      if (navigator.share) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File([blob], '紫微命盘.png', { type: 'image/png' });
          await navigator.share({ files: [file], title: '我的紫微命盘', text: '来自 CyberFate 赛博命理师' });
        }
      }
    } catch {
      // Share API not supported, fallback to download
    } finally {
      setGenerating(false);
    }
  }, [generateImage]);

  return (
    <div className="flex items-center gap-2">
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={generateImage}
        disabled={generating}
        className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors px-3 py-2 rounded-xl border border-[#E8E4DD] hover:border-[#1C1A16]/20 disabled:opacity-50"
        aria-label="下载命盘图片"
      >
        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span>保存图片</span>
      </button>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleShare}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors px-3 py-2 rounded-xl border border-[#E8E4DD] hover:border-[#1C1A16]/20 disabled:opacity-50"
          aria-label="分享命盘"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>分享</span>
        </button>
      )}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

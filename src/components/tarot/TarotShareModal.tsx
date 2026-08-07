'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/components/ui/Toast';
import { track } from '@/lib/analytics';

/**
 * 牌阵分享卡（PRD-TAROT-V2 P1-A）：分享前先预览，确认后导出。
 * 卡面 = 牌阵牌图 + 一句话答案 + 二维码 + 免责；
 * 问题默认不带（隐私），勾选才上卡。凯尔特十字取关键 4 张（现状/挑战/可能结果/最终结局）。
 */

export interface ShareCardInfo {
  name_zh: string;
  orientation: 'upright' | 'reversed';
  image_url: string;
  position?: string;
}

interface TarotShareModalProps {
  open: boolean;
  onClose: () => void;
  cards: ShareCardInfo[];
  spread: string;
  question: string;
  oneLineAnswer?: string;
}

const CARD_W = 750;
const CARD_H = 1334;
const SHARE_URL = 'https://www.cyberfate.me/tarot?ref=share';

/** 凯尔特十字只取关键 4 张：①现状 ②挑战 ⑦可能结果 ⑩最终结局 */
function pickShareCards(cards: ShareCardInfo[], spread: string): ShareCardInfo[] {
  if (spread === 'celtic' && cards.length === 10) {
    return [cards[0], cards[1], cards[6], cards[9]];
  }
  return cards;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) lines.push(text.slice(i, i + maxChars));
  return lines;
}

async function buildCanvas(
  cards: ShareCardInfo[],
  oneLineAnswer: string | undefined,
  question: string | undefined,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // 纸面底（与牌背同源）
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, '#FAF9F6');
  bg.addColorStop(1, '#F3EFE7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = 'center';

  // 品牌
  ctx.fillStyle = '#1C1A16';
  ctx.font = 'bold 44px serif';
  ctx.fillText('赛博命理师', CARD_W / 2, 130);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.5)';
  ctx.fillText('塔罗占卜 · CyberFate.me', CARD_W / 2, 168);

  // 牌阵（1-5 张横排）
  const n = cards.length;
  const cw = n <= 1 ? 220 : n <= 3 ? 180 : 140;
  const ch = cw * 1.5;
  const gap = n <= 3 ? 28 : 18;
  const totalW = n * cw + (n - 1) * gap;
  let x = (CARD_W - totalW) / 2;
  const y = 240;

  for (const card of cards) {
    try {
      const img = await loadImage(card.image_url);
      ctx.save();
      // 圆角裁切
      const r = 14;
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, r);
      ctx.clip();
      if (card.orientation === 'reversed') {
        ctx.translate(x + cw / 2, y + ch / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch);
      } else {
        ctx.drawImage(img, x, y, cw, ch);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(28,26,22,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, 14);
      ctx.stroke();
    } catch {
      // 图片加载失败：画占位框
      ctx.strokeStyle = 'rgba(28,26,22,0.2)';
      ctx.strokeRect(x, y, cw, ch);
    }
    // 牌名 + 正逆位
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#1C1A16';
    ctx.fillText(card.name_zh, x + cw / 2, y + ch + 34);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = card.orientation === 'upright' ? '#059669' : 'rgba(28,26,22,0.55)';
    ctx.fillText(card.orientation === 'upright' ? '正位' : '逆位', x + cw / 2, y + ch + 62);
    x += cw + gap;
  }

  let cursorY = y + ch + 120;

  // 问题（勾选才带）
  if (question) {
    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'rgba(28,26,22,0.5)';
    const qLines = wrapText(`问：${question}`, 26);
    for (const line of qLines.slice(0, 2)) {
      ctx.fillText(line, CARD_W / 2, cursorY);
      cursorY += 34;
    }
    cursorY += 10;
  }

  // 一句话答案（签文引言卡）
  if (oneLineAnswer) {
    const lines = wrapText(oneLineAnswer, 15);
    const lineH = 52;
    const boxH = 70 + lines.length * lineH;
    const boxX = 56;
    const boxW = CARD_W - 112;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(boxX, cursorY, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(28,26,22,0.1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, cursorY, boxW, boxH, 20);
    ctx.stroke();

    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(28,26,22,0.45)';
    ctx.fillText('✦ 一句话答案', CARD_W / 2, cursorY + 42);
    ctx.font = '30px serif';
    ctx.fillStyle = 'rgba(28,26,22,0.88)';
    lines.forEach((line, i) => {
      ctx.fillText(line, CARD_W / 2, cursorY + 88 + i * lineH);
    });
  }

  // 底部：二维码 + 免责
  const qrSize = 140;
  const qrY = CARD_H - 240;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, SHARE_URL, {
    width: qrSize,
    margin: 1,
    color: { dark: '#1C1A16', light: '#FAF9F6' },
  });
  ctx.drawImage(qrCanvas, (CARD_W - qrSize) / 2, qrY, qrSize, qrSize);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.55)';
  ctx.fillText('扫码抽一张你的塔罗牌', CARD_W / 2, qrY + qrSize + 36);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(28,26,22,0.35)';
  ctx.fillText('命理内容仅供娱乐参考', CARD_W / 2, qrY + qrSize + 66);

  return canvas;
}

export function TarotShareModal({ open, onClose, cards, spread, question, oneLineAnswer }: TarotShareModalProps) {
  const toast = useToast();
  const [withQuestion, setWithQuestion] = useState(false); // 默认不带问题（隐私）
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const shareCards = pickShareCards(cards, spread);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(SHARE_URL, { width: 120, margin: 1, color: { dark: '#1C1A16', light: '#FAF9F6' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberfate-tarot-share.png'; // 重名浏览器自动加序号
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCanvas = async (mode: 'download' | 'copy') => {
    if (busy) return;
    setBusy(true);
    track('tarot_share_export', { mode, spread });
    try {
      const canvas = await buildCanvas(shareCards, oneLineAnswer, withQuestion ? question : undefined);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('生成失败，请重试');
          setBusy(false);
          return;
        }
        if (mode === 'download') {
          downloadBlob(blob);
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            downloadBlob(blob);
            toast.error('您的浏览器不支持复制图片，已为您下载');
          }
        }
        setBusy(false);
      }, 'image/png');
    } catch {
      toast.error('生成失败，请重试');
      setBusy(false);
    }
  };

  // 文字分享：客户端同步拼接（不 await 接口——异步后用户手势激活过期，
  // Safari 等会拒绝 navigator.share / clipboard 导致「点了没反应」）
  const SPREAD_SHARE_NAMES: Record<string, string> = {
    single: '单张牌', three: '经典三张牌', celtic: '凯尔特十字',
    moonlight: '月光模式', mirror: '镜像模式', relationship: '关系牌阵',
  };

  const buildShareText = () =>
    `🔮 塔罗占卜结果\n\n` +
    `${withQuestion && question ? `问题：${question}\n` : ''}` +
    `牌阵：${SPREAD_SHARE_NAMES[spread] ?? '塔罗牌阵'}\n\n` +
    `抽到的牌：\n${cards.map((c) => `${c.name_zh}（${c.orientation === 'upright' ? '正位' : '逆位'}）`).join('\n')}` +
    `${oneLineAnswer ? `\n\n一句话答案：${oneLineAnswer}` : ''}` +
    `\n\n来自赛博命理师 - https://cyberfate.me/tarot`;

  const shareText = async () => {
    track('tarot_share_export', { mode: 'text', spread });
    const text = buildShareText();
    // 优先系统分享面板；用户取消则结束，不可用/被拒则回落剪贴板
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // 用户主动取消
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('分享内容已复制到剪贴板');
    } catch {
      toast.error('复制失败，请截图或手动复制');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-[#1C1A16]/10 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1C1A16]/8 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-[#1C1A16]">分享这次占卜</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#1C1A16]/50 transition-colors hover:bg-[#FAF9F6] hover:text-[#1C1A16]"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* 预览（与导出图同构的 DOM 版） */}
          <div className="mx-auto overflow-hidden rounded-2xl border border-[#1C1A16]/10" style={{ maxWidth: 340 }}>
            <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-[#FAF9F6] to-[#F3EFE7] px-5 py-7">
              <div className="text-center">
                <p className="font-display text-lg font-bold text-[#1C1A16]">赛博命理师</p>
                <p className="mt-0.5 text-[10px] text-[#1C1A16]/50">塔罗占卜 · CyberFate.me</p>
              </div>

              <div className="flex items-start justify-center gap-2">
                {shareCards.map((card, i) => (
                  <div key={`${card.name_zh}-${i}`} className="text-center" style={{ width: shareCards.length <= 3 ? 72 : 56 }}>
                    <div
                      className="overflow-hidden rounded-lg border border-[#1C1A16]/15"
                      style={{ aspectRatio: '2 / 3' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image_url}
                        alt={card.name_zh}
                        className="h-full w-full object-cover"
                        style={{ transform: card.orientation === 'reversed' ? 'rotate(180deg)' : undefined }}
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] font-medium text-[#1C1A16]">{card.name_zh}</p>
                    <p className={`text-[9px] ${card.orientation === 'upright' ? 'text-emerald-600' : 'text-[#1C1A16]/50'}`}>
                      {card.orientation === 'upright' ? '正位' : '逆位'}
                    </p>
                  </div>
                ))}
              </div>

              {withQuestion && question && (
                <p className="max-w-[260px] text-center text-[11px] text-[#1C1A16]/50">问：{question}</p>
              )}

              {oneLineAnswer && (
                <div className="w-full rounded-xl border border-[#1C1A16]/10 bg-white/85 px-4 py-3">
                  <p className="text-center text-[9px] tracking-[0.2em] text-[#1C1A16]/45">✦ 一句话答案</p>
                  <p className="mt-1.5 text-center font-display text-[13px] leading-relaxed text-[#1C1A16]/85">
                    {oneLineAnswer}
                  </p>
                </div>
              )}

              <div className="text-center">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR Code" className="mx-auto h-[52px] w-[52px]" style={{ imageRendering: 'pixelated' }} />
                )}
                <p className="mt-1 text-[9px] text-[#1C1A16]/50">扫码抽一张你的塔罗牌</p>
                <p className="text-[8px] text-[#1C1A16]/35">命理内容仅供娱乐参考</p>
              </div>
            </div>
          </div>

          {/* 带问题开关（默认关，防敏感问题外泄） */}
          {question && (
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={withQuestion}
                onChange={(e) => setWithQuestion(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1C1A16]"
              />
              <span className="text-xs text-[#1C1A16]/65">
                在分享卡上带上我的问题
                <span className="ml-1 text-[#1C1A16]/40">（默认不带，保护隐私）</span>
              </span>
            </label>
          )}

          {/* 操作 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => exportCanvas('download')}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {busy ? '生成中…' : '下载分享图'}
            </button>
            <button
              type="button"
              onClick={() => exportCanvas('copy')}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1C1A16]/15 px-4 py-2.5 text-sm font-medium text-[#1C1A16] transition-colors hover:bg-[#1C1A16]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制' : '复制图片'}
            </button>
          </div>
          <button
            type="button"
            onClick={shareText}
            className="flex w-full items-center justify-center gap-1.5 py-1 text-xs text-[#1C1A16]/50 transition-colors hover:text-[#1C1A16]"
          >
            <Share2 className="h-3.5 w-3.5" />
            只分享文字版
          </button>
        </div>
      </div>
    </div>
  );
}

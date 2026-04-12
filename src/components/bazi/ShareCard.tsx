'use client';

import { useState, useRef } from 'react';
import { Share2, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { PillarRecord } from '@/lib/bazi/types';
import { cn } from '@/lib/utils/cn';

interface ShareCardProps {
  pillars: PillarRecord;
  dayMaster: string;
  zodiac: string;
  summary: string;
  className?: string;
}

export function ShareCard({ pillars, dayMaster, zodiac, summary, className }: ShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const baziText = `${pillars.year.gan}${pillars.year.zhi} ${pillars.month.gan}${pillars.month.zhi} ${pillars.day.gan}${pillars.day.zhi} ${pillars.hour.gan}${pillars.hour.zhi}`;

  const handleGenerate = async () => {
    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FAF9F6',
        logging: false,
        useCORS: true,
      });

      // 转换为 Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('图片生成失败，请重试');
          setIsGenerating(false);
          return;
        }

        // 下载图片
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cyberfate-bazi-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      alert('生成失败，请重试');
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FAF9F6',
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('图片生成失败，请重试');
          setIsGenerating(false);
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('复制失败:', err);
          alert('复制失败，请使用下载功能');
        }

        setIsGenerating(false);
      }, 'image/png');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      alert('生成失败，请重试');
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
          ref={cardRef}
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
            {/* 四柱摘要 */}
            <p className="font-mono text-lg font-semibold tracking-[0.12em] text-[#1C1A16] mb-2">
              {baziText}
            </p>
            {/* 日主信息 */}
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
            <div className="rounded-xl bg-[#1C1A16] text-white px-6 py-3 inline-block">
              <p className="text-sm font-medium">
                扫码查看你的命盘 →
              </p>
            </div>
            <p className="mt-4 text-xs text-[#1C1A16]/40">
              www.cyberfate.me/bazi
            </p>
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

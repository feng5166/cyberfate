'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { PalaceData } from './types';

interface SihuaAnimationProps {
  palaces: PalaceData[];
  visible?: boolean;
  className?: string;
}

interface SihuaLink {
  type: '化禄' | '化权' | '化科' | '化忌';
  starName: string;
  fromPalace: string;
  toPalace: string;
  color: string;
}

const SIHUA_LINKS: SihuaLink[] = [
  { type: '化禄', starName: '贪狼', fromPalace: '命宫', toPalace: '财帛', color: '#059669' },
  { type: '化权', starName: '紫微', fromPalace: '命宫', toPalace: '命宫', color: '#7C3AED' },
  { type: '化科', starName: '天机', fromPalace: '命宫', toPalace: '交友', color: '#3B82F6' },
  { type: '化忌', starName: '巨门', fromPalace: '命宫', toPalace: '疾厄', color: '#DC2626' },
];

const SIHUA_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  '化禄': { label: '禄', desc: '财禄亨通' },
  '化权': { label: '权', desc: '权势威望' },
  '化科': { label: '科', desc: '文名声誉' },
  '化忌': { label: '忌', desc: '阻碍困难' },
};

export function SihuaAnimation({ palaces, visible = true, className }: SihuaAnimationProps) {
  const [activeLink, setActiveLink] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAnimating(true);
    let idx = 0;
    const timer = setInterval(() => {
      setActiveLink(idx);
      idx = (idx + 1) % SIHUA_LINKS.length;
    }, 2500);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6', className)}>
      <h3 className="font-display text-lg font-semibold text-[#1C1A16] mb-4 text-center">
        四化飞星
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {SIHUA_LINKS.map((link, index) => {
          const isActive = activeLink === index;
          const typeInfo = SIHUA_TYPE_LABELS[link.type];

          return (
            <button
              key={link.type}
              type="button"
              onClick={() => setActiveLink(index)}
              className={cn(
                'relative rounded-xl border p-4 text-center transition-all duration-300 cursor-pointer',
                isActive
                  ? 'border-2 bg-[rgba(28,26,22,0.03)]'
                  : 'border-[#E8E4DD] hover:border-[#1C1A16]/20',
              )}
              style={isActive ? { borderColor: link.color } : undefined}
              aria-label={`${link.type}: ${link.starName}`}
            >
              {/* 四化类型标识 */}
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm mb-2"
                style={{ backgroundColor: link.color }}
              >
                {typeInfo.label}
              </div>
              <div className="text-sm font-semibold text-[#1C1A16]">{link.type}</div>
              <div className="text-xs text-[#1C1A16]/40 mt-0.5">{link.starName}</div>

              {/* 飞星路径 */}
              {isActive && (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: link.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 当前选中的四化详情 */}
      {activeLink !== null && (
        <div
          className="rounded-xl p-4 transition-all duration-300"
          style={{
            backgroundColor: `${SIHUA_LINKS[activeLink].color}08`,
            borderLeft: `3px solid ${SIHUA_LINKS[activeLink].color}`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-sm font-bold"
              style={{ color: SIHUA_LINKS[activeLink].color }}
            >
              {SIHUA_LINKS[activeLink].type}
            </span>
            <span className="text-sm text-[#1C1A16]/60">
              {SIHUA_LINKS[activeLink].starName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#1C1A16]/50">
            <span className="px-2 py-0.5 rounded bg-white border border-[#E8E4DD] text-xs">
              {SIHUA_LINKS[activeLink].fromPalace}
            </span>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
              <path
                d="M0 6h20m0 0l-4-4m4 4l-4 4"
                stroke={SIHUA_LINKS[activeLink].color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </svg>
            <span className="px-2 py-0.5 rounded bg-white border border-[#E8E4DD] text-xs">
              {SIHUA_LINKS[activeLink].toPalace}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#1C1A16]/40">
            {SIHUA_TYPE_LABELS[SIHUA_LINKS[activeLink].type].desc}
          </p>
        </div>
      )}
    </div>
  );
}

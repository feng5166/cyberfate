'use client';

import { useState, useEffect, useRef } from 'react';
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
  bgColor: string;
  description: string;
}

const SIHUA_LINKS: SihuaLink[] = [
  {
    type: '化禄', starName: '贪狼', fromPalace: '命宫', toPalace: '财帛',
    color: '#059669', bgColor: '#ECFDF5',
    description: '贪狼化禄入财帛，一生财路亨通，善于社交求财，中年后财运尤旺。',
  },
  {
    type: '化权', starName: '紫微', fromPalace: '命宫', toPalace: '命宫',
    color: '#3B82F6', bgColor: '#EFF6FF',
    description: '紫微化权坐命，领导力与决断力极强，在人群中自然居于核心地位。',
  },
  {
    type: '化科', starName: '天机', fromPalace: '命宫', toPalace: '交友',
    color: '#7C3AED', bgColor: '#F5F3FF',
    description: '天机化科入交友，社交圈层高雅，多得学识渊博之人指点。',
  },
  {
    type: '化忌', starName: '巨门', fromPalace: '命宫', toPalace: '疾厄',
    color: '#DC2626', bgColor: '#FEF2F2',
    description: '巨门化忌在疾厄，注意消化系统与口腔健康，防口舌是非引发精神压力。',
  },
];

const SIHUA_TYPE_LABELS: Record<string, string> = {
  '化禄': '禄',
  '化权': '权',
  '化科': '科',
  '化忌': '忌',
};

export function SihuaAnimation({ palaces, visible = true, className }: SihuaAnimationProps) {
  const [activeLink, setActiveLink] = useState<number>(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!visible || !autoPlay) return;
    autoPlayRef.current = setInterval(() => {
      setActiveLink((prev) => (prev + 1) % SIHUA_LINKS.length);
    }, 3500);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [visible, autoPlay]);

  const handleSelect = (index: number) => {
    setActiveLink(index);
    setAutoPlay(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  if (!visible) return null;

  const active = SIHUA_LINKS[activeLink];

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6', className)}>
      <h3 className="font-display text-lg font-semibold text-[#1C1A16] mb-5 text-center">
        四化飞星
      </h3>

      {/* 四化标签行 */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6">
        {SIHUA_LINKS.map((link, index) => {
          const isActive = activeLink === index;
          return (
            <button
              key={link.type}
              type="button"
              onClick={() => handleSelect(index)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer',
                isActive
                  ? 'shadow-md scale-[1.02]'
                  : 'hover:scale-[1.01] opacity-60 hover:opacity-80',
              )}
              style={{
                backgroundColor: isActive ? link.bgColor : '#FAF9F6',
                border: isActive ? `2px solid ${link.color}` : '1px solid #E8E4DD',
              }}
              aria-label={`${link.type}: ${link.starName}`}
              aria-pressed={isActive}
            >
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: link.color }}
              >
                {SIHUA_TYPE_LABELS[link.type]}
              </span>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold" style={{ color: link.color }}>{link.type}</div>
                <div className="text-[10px] text-[#1C1A16]/40">{link.starName}</div>
              </div>
              <div className="text-left sm:hidden">
                <div className="text-xs font-semibold" style={{ color: link.color }}>{link.type}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 飞星流程图 SVG */}
      <div className="flex justify-center mb-5">
        <svg
          width="320"
          height="72"
          viewBox="0 0 320 72"
          className="w-full max-w-[320px]"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={`arrow-${activeLink}`}
              viewBox="0 0 10 8"
              refX="9"
              refY="4"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 4 L 0 8 z" fill={active.color} />
            </marker>
            <linearGradient id={`line-grad-${activeLink}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={active.color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={active.color} stopOpacity="1" />
              <stop offset="100%" stopColor={active.color} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* 起始宫 */}
          <rect x="8" y="16" width="80" height="40" rx="10" fill={active.bgColor} stroke={active.color} strokeWidth="1.5" />
          <text x="48" y="33" textAnchor="middle" fill={active.color} fontSize="11" fontWeight="600">{active.fromPalace}</text>
          <text x="48" y="48" textAnchor="middle" fill="#1C1A16" fillOpacity="0.4" fontSize="10">{active.starName}</text>

          {/* 连线 + 箭头 */}
          <line
            x1="92" y1="36" x2="224" y2="36"
            stroke={`url(#line-grad-${activeLink})`}
            strokeWidth="2"
            strokeDasharray="6 3"
            markerEnd={`url(#arrow-${activeLink})`}
          >
            <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1.5s" repeatCount="indefinite" />
          </line>

          {/* 四化类型标记 */}
          <circle cx="160" cy="36" r="14" fill={active.color} />
          <text x="160" y="40" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
            {SIHUA_TYPE_LABELS[active.type]}
          </text>

          {/* 终点宫 */}
          <rect x="232" y="16" width="80" height="40" rx="10" fill={active.bgColor} stroke={active.color} strokeWidth="1.5" />
          <text x="272" y="33" textAnchor="middle" fill={active.color} fontSize="11" fontWeight="600">{active.toPalace}</text>
          <text x="272" y="48" textAnchor="middle" fill="#1C1A16" fillOpacity="0.4" fontSize="10">
            {active.fromPalace === active.toPalace ? '本宫' : '飞入'}
          </text>
        </svg>
      </div>

      {/* 描述区域 */}
      <div
        className="rounded-xl p-4 transition-all duration-300"
        style={{
          backgroundColor: active.bgColor,
          borderLeft: `3px solid ${active.color}`,
        }}
      >
        <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
          {active.description}
        </p>
      </div>
    </div>
  );
}

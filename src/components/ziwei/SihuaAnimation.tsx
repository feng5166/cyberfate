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
  ringColor: string;
  description: string;
}

const SIHUA_LINKS: SihuaLink[] = [
  {
    type: '化禄', starName: '贪狼', fromPalace: '命宫', toPalace: '财帛',
    color: '#059669', bgColor: '#ECFDF5', ringColor: 'rgba(5,150,105,0.15)',
    description: '贪狼化禄入财帛，一生财路亨通，善于社交求财，中年后财运尤旺。化禄为四化之首，代表财运、机遇与人缘，飞入财帛宫更是锦上添花，暗示求财渠道多元、贵人相助不断。',
  },
  {
    type: '化权', starName: '紫微', fromPalace: '命宫', toPalace: '命宫',
    color: '#2563EB', bgColor: '#EFF6FF', ringColor: 'rgba(37,99,235,0.15)',
    description: '紫微化权坐命，领导力与决断力极强，在人群中自然居于核心地位。化权主权力、掌控与竞争力，紫微帝星化权更是"权中之权"，适合管理层或自主创业。',
  },
  {
    type: '化科', starName: '天机', fromPalace: '命宫', toPalace: '交友',
    color: '#7C3AED', bgColor: '#F5F3FF', ringColor: 'rgba(124,58,237,0.15)',
    description: '天机化科入交友，社交圈层高雅，多得学识渊博之人指点。化科主文采、声誉与贵人，落在交友宫暗示朋友圈品质高，能从社交中获得知识与灵感。',
  },
  {
    type: '化忌', starName: '巨门', fromPalace: '命宫', toPalace: '疾厄',
    color: '#DC2626', bgColor: '#FEF2F2', ringColor: 'rgba(220,38,38,0.15)',
    description: '巨门化忌在疾厄，注意消化系统与口腔健康，防口舌是非引发精神压力。化忌主阻碍、执着与纠结，落在疾厄宫提醒需格外关注身心健康的调养。',
  },
];

const SIHUA_TYPE_LABELS: Record<string, string> = {
  '化禄': '禄',
  '化权': '权',
  '化科': '科',
  '化忌': '忌',
};

const SIHUA_NATURE: Record<string, string> = {
  '化禄': '吉',
  '化权': '吉',
  '化科': '吉',
  '化忌': '凶',
};

export function SihuaAnimation({ palaces, visible = true, className }: SihuaAnimationProps) {
  const [activeLink, setActiveLink] = useState<number>(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!visible || !autoPlay) return;
    autoPlayRef.current = setInterval(() => {
      setActiveLink((prev) => (prev + 1) % SIHUA_LINKS.length);
    }, 4000);
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
                'relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer',
                isActive
                  ? 'shadow-md scale-[1.03]'
                  : 'hover:scale-[1.01] opacity-55 hover:opacity-85',
              )}
              style={{
                backgroundColor: isActive ? link.bgColor : '#FAF9F6',
                border: isActive ? `2px solid ${link.color}` : '1px solid #E8E4DD',
                boxShadow: isActive ? `0 4px 14px ${link.ringColor}` : undefined,
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
              {isActive && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold"
                  style={{ backgroundColor: link.type === '化忌' ? '#EF4444' : '#10B981' }}
                >
                  {SIHUA_NATURE[link.type]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 飞星流程图 SVG */}
      <div className="flex justify-center mb-5">
        <svg
          width="340"
          height="88"
          viewBox="0 0 340 88"
          className="w-full max-w-[340px]"
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
              <stop offset="0%" stopColor={active.color} stopOpacity="0.2" />
              <stop offset="50%" stopColor={active.color} stopOpacity="1" />
              <stop offset="100%" stopColor={active.color} stopOpacity="0.2" />
            </linearGradient>
            <filter id={`glow-${activeLink}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 起始宫 */}
          <rect x="8" y="20" width="88" height="48" rx="12" fill={active.bgColor} stroke={active.color} strokeWidth="1.5" />
          <text x="52" y="39" textAnchor="middle" fill={active.color} fontSize="12" fontWeight="700">{active.fromPalace}</text>
          <text x="52" y="55" textAnchor="middle" fill="#1C1A16" fillOpacity="0.45" fontSize="10">{active.starName}</text>

          {/* 连线 + 箭头 */}
          <path
            d="M 100 44 C 140 44, 140 44, 170 44"
            stroke={active.color}
            strokeWidth="2"
            strokeOpacity="0.15"
            fill="none"
          />
          <line
            x1="100" y1="44" x2="234" y2="44"
            stroke={`url(#line-grad-${activeLink})`}
            strokeWidth="2.5"
            strokeDasharray="6 4"
            markerEnd={`url(#arrow-${activeLink})`}
          >
            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
          </line>

          {/* 四化类型标记 */}
          <circle cx="170" cy="44" r="16" fill={active.color} filter={`url(#glow-${activeLink})`}>
            <animate attributeName="r" values="15;17;15" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="170" y="49" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
            {SIHUA_TYPE_LABELS[active.type]}
          </text>

          {/* 终点宫 */}
          <rect x="244" y="20" width="88" height="48" rx="12" fill={active.bgColor} stroke={active.color} strokeWidth="1.5" />
          <text x="288" y="39" textAnchor="middle" fill={active.color} fontSize="12" fontWeight="700">{active.toPalace}</text>
          <text x="288" y="55" textAnchor="middle" fill="#1C1A16" fillOpacity="0.45" fontSize="10">
            {active.fromPalace === active.toPalace ? '本宫' : '飞入'}
          </text>

          {/* 底部流向标注 */}
          <text x="170" y="82" textAnchor="middle" fill={active.color} fillOpacity="0.5" fontSize="9">
            {active.fromPalace} → {active.type} → {active.toPalace}
          </text>
        </svg>
      </div>

      {/* 描述区域 */}
      <div
        className="rounded-xl p-4 transition-all duration-300"
        style={{
          backgroundColor: active.bgColor,
          borderLeft: `4px solid ${active.color}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: active.color }}
          >
            {active.type}
          </span>
          <span className="text-xs text-[#1C1A16]/50">
            {active.starName}{active.type} → {active.toPalace}
          </span>
        </div>
        <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
          {active.description}
        </p>
      </div>
    </div>
  );
}

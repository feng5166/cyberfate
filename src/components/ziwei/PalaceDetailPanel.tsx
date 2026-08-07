'use client';

import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PalaceData, STAR_COLORS } from './types';
import { StarIcon } from './StarIcon';

interface PalaceDetailPanelProps {
  palace: PalaceData;
  onClose: () => void;
  /** 「AI 深读此宫」入口（PRD-ZIWEI-V2 P0-B）：触发下方 AI 区生成该宫解读 */
  onAiRead?: (palaceName: string) => void;
  className?: string;
}

/** 生年四化标签配色（禄绿/权蓝/科紫/忌琥珀——忌走「功课」框架不用红色恐吓） */
const SIHUA_TAG_STYLES: Record<string, string> = {
  '化禄': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '化权': 'bg-blue-50 text-blue-700 border-blue-200',
  '化科': 'bg-purple-50 text-purple-700 border-purple-200',
  '化忌': 'bg-amber-50 text-amber-700 border-amber-200',
};

const BRIGHTNESS_TAG_STYLES: Record<string, string> = {
  '庙': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '旺': 'bg-blue-50 text-blue-700 border-blue-200',
  '得': 'bg-stone-100 text-[#1C1A16] border-stone-300',
  '利': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '平': 'bg-gray-50 text-gray-600 border-gray-200',
  '不': 'bg-stone-100 text-[#1C1A16] border-stone-300',
  '陷': 'bg-red-50 text-red-600 border-red-200',
};

const TYPE_LABELS: Record<string, string> = {
  major: '主星',
  minor: '辅星',
  auxiliary: '吉星',
  evil: '煞星',
};

export function PalaceDetailPanel({ palace, onClose, onAiRead, className }: PalaceDetailPanelProps) {
  const allStars = [
    ...(palace.majorStars || []).map((s) => ({ ...s, typeLabel: TYPE_LABELS[s.type] || s.type })),
    ...(palace.minorStars || []).map((s) => ({ ...s, typeLabel: TYPE_LABELS[s.type] || s.type })),
  ];

  return (
    <div
      className={cn('bg-white rounded-2xl border border-[#1C1A16]/8 p-5 sm:p-6 relative', className)}
      role="region"
      aria-label={`${palace.name}详情`}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#FAF9F6] transition-colors text-[#1C1A16]/40 hover:text-[#1C1A16]"
        aria-label="关闭详情面板"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 区块1: 宫位基本信息 */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-display text-xl font-bold text-[#1C1A16]">{palace.name}</h3>
          <span className="text-sm text-[#1C1A16]/50">
            {palace.stem}{palace.branch}
          </span>
          {palace.isLife && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
              命宫
            </span>
          )}
          {palace.isBody && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
              身宫
            </span>
          )}
        </div>

        {/* 属性 Tag 组 */}
        <div className="flex flex-wrap gap-2">
          {allStars
            .filter((s) => s.brightness)
            .map((star) => (
              <span
                key={star.name}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
                  BRIGHTNESS_TAG_STYLES[star.brightness!] || 'bg-gray-50 text-gray-600 border-gray-200',
                )}
              >
                <StarIcon starName={star.name} size={6} />
                {star.name}
                <span className="font-medium">{star.brightness}</span>
              </span>
            ))}
        </div>
      </div>

      {/* 区块2: 星曜列表表格 */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-[#1C1A16]/60 mb-3">星曜列表</h4>
        <div className="rounded-xl border border-[#E8E4DD] overflow-hidden">
          <div className="grid grid-cols-[72px_1fr_80px_64px_1fr] gap-0 text-xs bg-[#FAF9F6] border-b border-[#E8E4DD] px-4 py-2.5 font-medium text-[#1C1A16]/50 hidden sm:grid">
            <span>类型</span>
            <span>星曜</span>
            <span>亮度</span>
            <span>庙旺陷</span>
            <span>说明</span>
          </div>

          {allStars.map((star) => (
            <div
              key={star.name}
              className={cn(
                'px-4 py-3 border-b border-[#E8E4DD] last:border-b-0',
                'flex flex-col sm:grid sm:grid-cols-[72px_1fr_80px_64px_1fr] sm:items-center gap-1 sm:gap-0',
              )}
            >
              {/* 类型 */}
              <span
                className={cn(
                  'text-[11px] font-medium sm:text-xs',
                  star.type === 'evil' ? 'text-red-500' : 'text-[#1C1A16]/50',
                )}
              >
                {star.typeLabel}
              </span>

              {/* 星曜名 */}
              <div className="flex items-center gap-2">
                <StarIcon starName={star.name} size={8} />
                <span
                  className={cn(
                    'font-semibold',
                    star.type === 'major' ? 'text-base' : 'text-sm',
                    star.type === 'evil' && 'text-red-500',
                  )}
                  style={star.type !== 'evil' ? { color: STAR_COLORS[star.name] || '#1C1A16' } : undefined}
                >
                  {star.name}
                </span>
                {star.sihua && (
                  <span
                    className={cn(
                      'inline-flex text-[10px] px-1.5 py-0.5 rounded border font-medium',
                      SIHUA_TAG_STYLES[star.sihua] || 'bg-gray-50 text-gray-600 border-gray-200',
                    )}
                  >
                    {star.sihua}
                  </span>
                )}
              </div>

              {/* 亮度（星级） */}
              <div className="flex items-center gap-0.5">
                {star.brightness
                  ? Array.from({ length: getBrightnessLevel(star.brightness) }).map((_, i) => (
                      <span key={i} className="text-stone-500 text-xs">★</span>
                    ))
                  : <span className="text-[#1C1A16]/20 text-xs">—</span>}
              </div>

              {/* 庙旺陷 */}
              {star.brightness ? (
                <span
                  className={cn(
                    'inline-flex w-fit text-[11px] px-2 py-0.5 rounded border font-medium',
                    BRIGHTNESS_TAG_STYLES[star.brightness],
                  )}
                >
                  {star.brightness}
                </span>
              ) : (
                <span className="text-[#1C1A16]/20 text-xs">—</span>
              )}

              {/* 说明 */}
              <span className="text-xs text-[#1C1A16]/40 hidden sm:block">
                {getStarDescription(star.name, star.type)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 区块3: AI 深读入口（PRD-ZIWEI-V2：真 AI，替换 V1 静态示例与假评分） */}
      {onAiRead && (
        <button
          type="button"
          onClick={() => onAiRead(palace.name)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#7E22CE]/25 bg-[#F3E8FF]/30 text-sm font-medium text-[#1C1A16] hover:border-[#7E22CE]/50 hover:bg-[#F3E8FF]/50 transition-colors"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
          AI 深读{palace.name}宫（基于你的真实命盘）
        </button>
      )}
    </div>
  );
}

function getBrightnessLevel(brightness: string): number {
  const levels: Record<string, number> = {
    '庙': 5, '旺': 4, '得': 3, '利': 3, '平': 2, '不': 1, '陷': 1,
  };
  return levels[brightness] || 2;
}

function getStarDescription(name: string, type: string): string {
  const descriptions: Record<string, string> = {
    '紫微': '帝星，主尊贵、领导',
    '天机': '智慧之星，主谋略',
    '太阳': '光明之星，主贵显',
    '武曲': '财星，主刚毅果断',
    '天同': '福星，主安逸享乐',
    '廉贞': '官禄主，主事业桃花',
    '天府': '库星，主稳重富足',
    '太阴': '财星，主柔顺内敛',
    '贪狼': '桃花星，主欲望才艺',
    '巨门': '暗星，主口舌是非',
    '天相': '印星，主辅佐和谐',
    '七杀': '将星，主威严权力',
    '破军': '耗星，主变动开创',
    '天梁': '荫星，主清高正直',
    '文昌': '科甲之星，利学业',
    '文曲': '才艺之星，利文艺',
    '左辅': '贵人星，助力事业',
    '右弼': '贵人星，助力人缘',
    '天魁': '昼贵人，主正途助力',
    '天钺': '夜贵人，主暗中相助',
    '禄存': '财禄之星，主稳定收入',
    '天马': '驿马星，主变动奔波',
    '擎羊': '刑星，主刑伤阻碍',
    '陀罗': '忌星，主拖延纠缠',
    '火星': '暴星，主急躁冲动',
    '铃星': '暗火，主隐患暗伤',
    '地空': '空星，主空想虚耗',
    '地劫': '劫星，主损耗破败',
  };
  return descriptions[name] || `${type === 'evil' ? '煞星' : '辅星'}，需综合判断`;
}

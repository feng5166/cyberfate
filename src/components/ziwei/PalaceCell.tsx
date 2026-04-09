'use client';

import { cn } from '@/lib/utils/cn';
import { PalaceData, STAR_COLORS } from './types';
import { StarIcon } from './StarIcon';

interface PalaceCellProps {
  palace: PalaceData;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PalaceCell({ palace, selected = false, onClick, className }: PalaceCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${palace.name} - ${palace.branch}`}
      aria-pressed={selected}
      className={cn(
        'relative text-left bg-white border rounded-xl p-3 min-h-[120px] transition-all duration-200 cursor-pointer',
        'hover:border-[#1C1A16] hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/20',
        selected
          ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]'
          : 'border-[#E8E4DD]',
        className,
      )}
    >
      {/* 顶部：宫名 + 地支 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-[#1C1A16]/55 font-medium">
          {palace.name}
        </span>
        <span className="text-[11px] text-[#1C1A16]/40">
          {palace.stem && `${palace.stem}`}{palace.branch}
        </span>
      </div>

      {/* 命宫标记 */}
      {palace.isLife && (
        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
          命
        </span>
      )}

      {/* 主星区域 */}
      <div className="flex flex-col items-center justify-center min-h-[48px] gap-1 my-1">
        {palace.majorStars.map((star) => (
          <div key={star.name} className="flex items-center gap-1.5">
            <StarIcon starName={star.name} size={8} />
            <span
              className="text-sm font-semibold"
              style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
            >
              {star.name}
            </span>
            {star.brightness && (
              <span className="text-[10px] text-[#1C1A16]/40">{star.brightness}</span>
            )}
          </div>
        ))}
        {palace.majorStars.length === 0 && (
          <span className="text-xs text-[#1C1A16]/20">—</span>
        )}
      </div>

      {/* 分隔线 + 辅星 */}
      {palace.minorStars.length > 0 && (
        <>
          <div className="border-t border-[#E8E4DD]/80 my-1.5" />
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center">
            {palace.minorStars.map((star) => (
              <span
                key={star.name}
                className={cn(
                  'text-[10px]',
                  star.type === 'evil' ? 'text-red-400/70' : 'text-[#1C1A16]/40',
                )}
              >
                {star.name}
              </span>
            ))}
          </div>
        </>
      )}
    </button>
  );
}

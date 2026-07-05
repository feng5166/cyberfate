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
        'relative flex flex-col text-left bg-white border rounded-xl p-3 lg:p-4 min-h-[120px] lg:min-h-[150px] xl:min-h-[172px]',
        'transition-all duration-200 cursor-pointer',
        'hover:border-[#1C1A16] hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-accent/30',
        selected
          ? 'border-2 border-brand-accent bg-brand-accent-tint'
          : 'border border-[#E8EDE5]',
        className,
      )}
    >
      {/* 顶部：宫名（左）+ 天干地支（右） */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#1C1A16]/55 font-medium leading-none">
            {palace.name}
          </span>
          {palace.isLife && (
            <span className="text-[11px] px-1.5 py-[1px] rounded bg-brand-accent-soft text-brand-accent font-medium leading-tight">
              命
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#1C1A16]/55 leading-none">
          {palace.stem && `${palace.stem}`}{palace.branch}
        </span>
      </div>

      {/* 主星区域 — 居中大字 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 my-1">
        {palace.majorStars?.map((star) => (
          <div key={star.name} className="flex items-center gap-1.5">
            <StarIcon starName={star.name} size={8} />
            <span
              className="text-[13px] lg:text-[15px] xl:text-[16px] font-bold leading-tight"
              style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
            >
              {star.name}
            </span>
            {star.brightness && (
              <span className="text-[11px] text-[#1C1A16]/50 leading-none">{star.brightness}</span>
            )}
          </div>
        ))}
        {(palace.majorStars?.length ?? 0) === 0 && (
          <span className="text-xs text-[#1C1A16]/15">—</span>
        )}
      </div>

      {/* 分隔线 + 辅星/煞星 */}
      {(palace.minorStars?.length ?? 0) > 0 && (
        <div className="mt-auto">
          <div className="border-t border-[#E8EDE5] my-1.5" />
          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 justify-center">
            {palace.minorStars?.map((star) => (
              <span
                key={star.name}
                className={cn(
                  'text-[11px] leading-tight',
                  star.type === 'evil' ? 'text-red-500' : 'text-[#1C1A16]/55',
                )}
              >
                {star.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

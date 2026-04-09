'use client';

import { cn } from '@/lib/utils/cn';
import { PalaceData, STAR_COLORS } from './types';
import { StarIcon } from './StarIcon';

interface PalaceMobileListProps {
  palaces: PalaceData[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function PalaceMobileList({ palaces, selectedIndex, onSelect }: PalaceMobileListProps) {
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="紫微斗数十二宫命盘">
      {palaces.map((palace, index) => {
        const isSelected = selectedIndex === index;

        return (
          <button
            key={palace.name}
            type="button"
            role="listitem"
            onClick={() => onSelect(index)}
            aria-pressed={isSelected}
            aria-label={`${palace.name} - ${palace.branch}`}
            className={cn(
              'w-full text-left bg-white border rounded-xl p-4 transition-all duration-200',
              'hover:border-[#1C1A16] hover:shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/20',
              isSelected
                ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.03)]'
                : 'border-[#E8E4DD]',
            )}
          >
            <div className="flex items-center gap-3">
              {/* 宫名 + 命宫标记 */}
              <div className="flex items-center gap-1.5 min-w-[60px]">
                <span className="text-sm font-medium text-[#1C1A16]">
                  {palace.name}
                </span>
                {palace.isLife && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
                    命
                  </span>
                )}
              </div>

              {/* 地支 */}
              <span className="text-xs text-[#1C1A16]/40 min-w-[30px]">
                {palace.stem}{palace.branch}
              </span>

              {/* 主星 */}
              <div className="flex items-center gap-2 flex-1">
                {palace.majorStars.map((star) => (
                  <div key={star.name} className="flex items-center gap-1">
                    <StarIcon starName={star.name} size={7} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
                    >
                      {star.name}
                    </span>
                    {star.brightness && (
                      <span className="text-[10px] text-[#1C1A16]/35">{star.brightness}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 辅星 */}
              <div className="flex items-center gap-1.5 shrink-0">
                {palace.minorStars.slice(0, 2).map((star) => (
                  <span
                    key={star.name}
                    className={cn(
                      'text-[10px]',
                      star.type === 'evil' ? 'text-red-400/70' : 'text-[#1C1A16]/35',
                    )}
                  >
                    {star.name}
                  </span>
                ))}
                {palace.minorStars.length > 2 && (
                  <span className="text-[10px] text-[#1C1A16]/25">+{palace.minorStars.length - 2}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="flex flex-col gap-2.5" role="list" aria-label="紫微斗数十二宫命盘">
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
                : 'border border-[#E8EDE5]',
            )}
          >
            {/* 第一行：宫名 + 地支 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#1C1A16]">
                  {palace.name}
                </span>
                {palace.isLife && (
                  <span className="text-[8px] px-1 py-[1px] rounded bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
                    命
                  </span>
                )}
              </div>
              <span className="text-xs text-[#1C1A16]/35">
                {palace.stem}{palace.branch}
              </span>
            </div>

            {/* 第二行：主星 */}
            <div className="flex items-center gap-3 mb-2">
              {palace.majorStars.map((star) => (
                <div key={star.name} className="flex items-center gap-1.5">
                  <StarIcon starName={star.name} size={8} />
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
                  >
                    {star.name}
                  </span>
                  {star.brightness && (
                    <span className="text-[11px] text-[#1C1A16]/35">{star.brightness}</span>
                  )}
                </div>
              ))}
              {palace.majorStars.length === 0 && (
                <span className="text-xs text-[#1C1A16]/20">无主星</span>
              )}
            </div>

            {/* 第三行：分隔线 + 辅星/煞星 */}
            {palace.minorStars.length > 0 && (
              <>
                <div className="border-t border-[#E8EDE5] mb-2" />
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {palace.minorStars.map((star) => (
                    <span
                      key={star.name}
                      className={cn(
                        'text-[11px]',
                        star.type === 'evil' ? 'text-red-400/80' : 'text-[#1C1A16]/40',
                      )}
                    >
                      {star.name}
                      {star.brightness && (
                        <span className="text-[#1C1A16]/25 ml-0.5">{star.brightness}</span>
                      )}
                    </span>
                  ))}
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

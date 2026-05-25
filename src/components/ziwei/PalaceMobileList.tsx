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
    <div className="flex flex-col gap-3" role="list" aria-label="紫微斗数十二宫命盘">
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
              'w-full text-left bg-white border rounded-2xl min-h-[100px]',
              'px-4 py-3 transition-all duration-200',
              'active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/20',
              isSelected
                ? 'border-2 border-[#1C1A16] bg-[rgba(28,26,22,0.04)] shadow-md'
                : 'border border-[#E8EDE5] shadow-sm',
            )}
          >
            {/* 第一行：宫名 + 地支 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#1C1A16]">
                  {palace.name}
                </span>
                {palace.isLife && (
                  <span className="text-[9px] px-1.5 py-[2px] rounded-full bg-amber-100 text-amber-700 font-medium leading-tight">
                    命宫
                  </span>
                )}
                {isSelected && (
                  <span className="text-[9px] px-1.5 py-[2px] rounded-full bg-[#1C1A16] text-white font-medium leading-tight">
                    查看中
                  </span>
                )}
              </div>
              <span className="text-xs text-[#1C1A16]/35 bg-[#FAF9F6] px-2 py-0.5 rounded-md">
                {palace.stem}{palace.branch}
              </span>
            </div>

            {/* 第二行：主星 */}
            <div className="flex items-center gap-4 mb-3">
              {palace.majorStars?.map((star) => (
                <div key={star.name} className="flex items-center gap-1.5">
                  <StarIcon starName={star.name} size={10} />
                  <span
                    className="text-base font-bold"
                    style={{ color: STAR_COLORS[star.name] || '#1C1A16' }}
                  >
                    {star.name}
                  </span>
                  {star.brightness && (
                    <span className="text-[11px] text-[#1C1A16]/35 bg-[#FAF9F6] px-1 py-[1px] rounded">
                      {star.brightness}
                    </span>
                  )}
                </div>
              ))}
              {(palace.majorStars?.length ?? 0) === 0 && (
                <span className="text-xs text-[#1C1A16]/20 italic">无主星</span>
              )}
            </div>

            {/* 第三行：分隔线 + 辅星/煞星 */}
            {(palace.minorStars?.length ?? 0) > 0 && (
              <>
                <div className="border-t border-[#E8EDE5] mb-3" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {palace.minorStars?.map((star) => (
                    <span
                      key={star.name}
                      className={cn(
                        'text-xs',
                        star.type === 'evil' ? 'text-red-400/80' : 'text-[#1C1A16]/45',
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

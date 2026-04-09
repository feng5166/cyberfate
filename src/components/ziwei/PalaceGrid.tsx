'use client';

import { PalaceData } from './types';
import { PalaceCell } from './PalaceCell';

interface PalaceGridProps {
  palaces: PalaceData[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

/**
 * 紫微斗数标准 4×4 网格命盘（中间 2×2 留空做信息区）
 *
 * 传统排列（逆时针，寅宫起）:
 *   巳       午       未       申
 *   辰       [中央]   [中央]   酉
 *   卯       [中央]   [中央]   戌
 *   寅       丑       子       亥
 *
 * palaces[0]=命宫 ... palaces[11]=父母
 * gridSlots: 16 格（4×4），中间 4 格为 null
 */

// 4×4 grid, 16 slots, palaceIndex=-1 means center placeholder
const GRID_SLOTS: (number | null)[] = [
  // row 0: 巳 午 未 申
  1, 2, 3, 4,
  // row 1: 辰 [center] [center] 酉
  0, null, null, 5,
  // row 2: 卯 [center] [center] 戌
  11, null, null, 6,
  // row 3: 寅 丑 子 亥
  10, 9, 8, 7,
];

export function PalaceGrid({ palaces, selectedIndex, onSelect }: PalaceGridProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2"
      role="grid"
      aria-label="紫微斗数十二宫命盘"
    >
      {GRID_SLOTS.map((palaceIndex, slotIndex) => {
        if (palaceIndex === null) {
          return <div key={`empty-${slotIndex}`} />;
        }

        const palace = palaces[palaceIndex];
        if (!palace) return <div key={`missing-${slotIndex}`} />;

        return (
          <PalaceCell
            key={`palace-${palaceIndex}`}
            palace={palace}
            selected={selectedIndex === palaceIndex}
            onClick={() => onSelect(palaceIndex)}
          />
        );
      })}
    </div>
  );
}

'use client';

import { PalaceData, CenterUserInfo } from './types';
import { PalaceCell } from './PalaceCell';
import { CenterInfoCard } from './CenterInfoCard';

interface PalaceGridProps {
  palaces: PalaceData[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  userInfo?: CenterUserInfo;
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
 * gridSlots: 16 格（4×4），中间 4 格为 null / 'center'
 */

type SlotValue = number | null | 'center';

const GRID_SLOTS: SlotValue[] = [
  // row 0: 巳 午 未 申
  1, 2, 3, 4,
  // row 1: 辰 [center] [center] 酉
  0, 'center', 'center', 5,
  // row 2: 卯 [center] [center] 戌
  11, 'center', 'center', 6,
  // row 3: 寅 丑 子 亥
  10, 9, 8, 7,
];

export function PalaceGrid({ palaces, selectedIndex, onSelect, userInfo }: PalaceGridProps) {
  let centerRendered = false;

  return (
    <div
      className="grid grid-cols-4 gap-1.5 lg:gap-2"
      role="grid"
      aria-label="紫微斗数十二宫命盘"
    >
      {GRID_SLOTS.map((slot, slotIndex) => {
        if (slot === 'center') {
          if (!centerRendered) {
            centerRendered = true;
            return (
              <CenterInfoCard
                key="center"
                userInfo={userInfo}
                palaces={palaces}
                className="col-span-2 row-span-2"
              />
            );
          }
          return null;
        }

        if (slot === null) {
          return <div key={`empty-${slotIndex}`} className="min-h-[120px]" />;
        }

        const palace = palaces[slot];
        if (!palace) return <div key={`missing-${slotIndex}`} />;

        return (
          <PalaceCell
            key={`palace-${slot}`}
            palace={palace}
            selected={selectedIndex === slot}
            onClick={() => onSelect(slot)}
          />
        );
      })}
    </div>
  );
}

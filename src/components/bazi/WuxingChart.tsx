'use client';

import type { FC } from 'react';
import type { WuxingCount } from '@/lib/bazi/types';
import { Flame, Gem, Leaf, MountainSnow, Droplets } from 'lucide-react';

interface WuxingChartProps {
  wuxing: WuxingCount;
}

const wuxingConfig = [
  { key: 'metal', label: '金', color: '#7C3AED', bg: '#F3E8FF', icon: Gem },
  { key: 'wood', label: '木', color: '#047857', bg: '#D1FAE5', icon: Leaf },
  { key: 'water', label: '水', color: '#2563EB', bg: '#DBEAFE', icon: Droplets },
  { key: 'fire', label: '火', color: '#DC2626', bg: '#FEE2E2', icon: Flame },
  { key: 'earth', label: '土', color: '#D97706', bg: '#FEF3C7', icon: MountainSnow },
] as const;

export const WuxingChart: FC<WuxingChartProps> = ({ wuxing }) => {
  const values = Object.values(wuxing);
  const total = values.reduce((sum, val) => sum + val, 0);
  const avg = total ? total / values.length : 0;

  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5">五行属性</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {wuxingConfig.map(({ key, label, color, bg, icon: Icon }) => {
          const value = wuxing[key];
          const status = value > avg + 0.5 ? '偏旺' : value < avg - 0.5 ? '偏弱' : '平衡';

          return (
            <div key={key} className="flex flex-col items-center text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: bg, color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="mt-2 text-sm font-medium text-[#1C1A16]">{label}</div>
              <div className="text-xs text-[#1C1A16]/50">{status}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

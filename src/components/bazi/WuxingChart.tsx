'use client';

import type { FC } from 'react';
import type { WuxingCount, WuXing } from '@/lib/bazi/types';
import type { LucideIcon } from 'lucide-react';
import { Flame, Gem, Leaf, MountainSnow, Droplets } from 'lucide-react';
import { WuxingDonutChart } from './WuxingDonutChart';

interface WuxingChartProps {
  wuxing: WuxingCount;
  dayMasterElement?: WuXing;
}

interface WuxingConfigItem {
  key: keyof WuxingCount;
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

const wuxingConfig: ReadonlyArray<WuxingConfigItem> = [
  { key: 'metal', label: '金', color: '#F59E0B', bg: '#FEF3C7', icon: Gem },
  { key: 'wood', label: '木', color: '#22C55E', bg: '#D1FAE5', icon: Leaf },
  { key: 'water', label: '水', color: '#3B82F6', bg: '#DBEAFE', icon: Droplets },
  { key: 'fire', label: '火', color: '#EF4444', bg: '#FEE2E2', icon: Flame },
  { key: 'earth', label: '土', color: '#EAB308', bg: '#FEF9E7', icon: MountainSnow },
];

/**
 * 状态颜色编码（旺绿/强蓝/弱橙/衰红）
 */
function getStatusStyle(status: string): string {
  if (status === '旺') return 'text-emerald-600 font-medium';
  if (status === '强') return 'text-blue-600 font-medium';
  if (status === '弱') return 'text-orange-500 font-medium';
  if (status === '衰') return 'text-red-600 font-medium';
  return 'text-[#1C1A16]/50';
}

export const WuxingChart: FC<WuxingChartProps> = ({ wuxing, dayMasterElement }) => {
  const values = Object.values(wuxing);
  const total = values.reduce((sum, val) => sum + val, 0);
  const avg = total ? total / values.length : 0;

  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5">五行属性</h3>
      
      {/* 五行 Tags */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {wuxingConfig.map(({ key, label, color, bg, icon: Icon }) => {
          const value = wuxing[key];
          let status = '平衡';
          if (value >= avg + 1.5) status = '旺';
          else if (value > avg + 0.5) status = '强';
          else if (value < avg - 1) status = '衰';
          else if (value < avg - 0.5) status = '弱';

          return (
            <div key={key} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: bg, color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="mt-2 text-sm font-medium text-[#1C1A16]">{label}</div>
              <div className="text-xs text-[#1C1A16]/40">{value}个</div>
              <div className={`text-xs ${getStatusStyle(status)}`}>{status}</div>
            </div>
          );
        })}
      </div>

      {/* 圆环图 */}
      {dayMasterElement && (
        <div className="mt-5 pt-5 border-t border-[rgba(28,26,22,0.06)]">
          <div className="flex flex-col items-center">
            <WuxingDonutChart wuxing={wuxing} dayMasterElement={dayMasterElement} />
            <p className="mt-3 text-xs text-[#1C1A16]/50 text-center">
              五行占比分布（总计 {total} 个）
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PalaceData } from './types';
import { PalaceGrid } from './PalaceGrid';
import { MOCK_PALACES } from './mockData';

interface DualChartCompareProps {
  chartA: PalaceData[];
  className?: string;
}

const MOCK_CHART_B: PalaceData[] = MOCK_PALACES.map((p, i) => ({
  ...p,
  stem: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'][i],
  majorStars: p.majorStars.length > 0
    ? [{ ...p.majorStars[0], brightness: (['庙', '旺', '得', '利', '平'] as const)[Math.floor(Math.random() * 5)] }]
    : [],
  minorStars: p.minorStars.slice(0, 1),
}));

export function DualChartCompare({ chartA, className }: DualChartCompareProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [selectedA, setSelectedA] = useState<number | null>(0);
  const [selectedB, setSelectedB] = useState<number | null>(0);

  if (!showCompare) {
    return (
      <button
        onClick={() => setShowCompare(true)}
        className={cn(
          'inline-flex items-center gap-2 text-sm text-[#1C1A16]/50 hover:text-[#1C1A16] transition-colors px-4 py-2.5 rounded-xl border border-[#E8E4DD] hover:border-[#1C1A16]/20',
          className,
        )}
        aria-label="双人命盘对比"
      >
        <Users className="w-4 h-4" />
        <span>双人对比</span>
      </button>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1C1A16]/50" />
          <h3 className="font-display text-lg font-semibold text-[#1C1A16]">双人命盘对比</h3>
        </div>
        <button
          onClick={() => setShowCompare(false)}
          className="text-xs text-[#1C1A16]/40 hover:text-[#1C1A16] transition-colors"
        >
          收起
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart A */}
        <div>
          <div className="text-center mb-3">
            <span className="text-sm font-medium text-[#1C1A16]/60">本人命盘</span>
          </div>
          <div className="hidden md:block">
            <PalaceGrid palaces={chartA} selectedIndex={selectedA} onSelect={setSelectedA} />
          </div>
        </div>

        {/* Chart B */}
        <div>
          <div className="text-center mb-3">
            <span className="text-sm font-medium text-[#1C1A16]/60">对方命盘</span>
            <span className="text-xs text-[#1C1A16]/30 ml-2">（示例数据）</span>
          </div>
          <div className="hidden md:block">
            <PalaceGrid palaces={MOCK_CHART_B} selectedIndex={selectedB} onSelect={setSelectedB} />
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#1C1A16]/30 mt-4 italic">
        双人对比功能开发中，敬请期待完整版...
      </p>
    </div>
  );
}

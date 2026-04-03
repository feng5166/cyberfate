'use client';

import type { TenGod, TianGan } from '@/lib/bazi';
import type { Pillar } from '@/lib/bazi/types';
import { getTenGod } from '@/lib/bazi';
import { cn } from '@/lib/utils/cn';

interface BaziChartProps {
  pillars: Record<'year' | 'month' | 'day' | 'hour', Pillar>;
}

const pillarConfig: { key: 'year' | 'month' | 'day' | 'hour'; label: string }[] = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

export function BaziChart({ pillars }: BaziChartProps) {
  const dayGan = pillars.day.gan as TianGan;

  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5">四柱命盘</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pillarConfig.map(({ key, label }) => {
          const pillar = pillars[key];
          const isDay = key === 'day';
          const tenGod: TenGod = isDay ? '日主' : getTenGod(dayGan, pillar.gan as TianGan);

          return (
            <div
              key={key}
              className={cn(
                'bg-white border-none rounded-xl p-4 shadow-none transition-all duration-300 text-center',
                'hover:-translate-y-0.5 hover:shadow-card-hover'
              )}
            >
              <div className="text-xl font-semibold text-[#1C1A16]">
                {`${pillar.gan}${pillar.zhi}`}
              </div>
              <div className="mt-2 text-xs text-[#1C1A16]/50">
                {isDay ? '日主' : label}
              </div>
              {isDay && (
                <span className="inline-flex items-center mt-2 bg-yellow-50 text-yellow-700 text-[11px] font-medium px-1.5 py-0.5 rounded">
                  日主
                </span>
              )}
              <div className="text-xs text-[#1C1A16]/70 mt-2">十神：{tenGod}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import type { PillarKey, PillarRecord } from '@/lib/bazi/types';
import { cn } from '@/lib/utils/cn';

interface BaziChartProps {
  pillars: PillarRecord;
}

const pillarConfig: { key: PillarKey; label: string }[] = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

const wuxingColorMap: Record<string, { bg: string; text: string }> = {
  金: { bg: '#F3E8FF', text: '#7C3AED' },
  木: { bg: '#D1FAE5', text: '#047857' },
  水: { bg: '#DBEAFE', text: '#2563EB' },
  火: { bg: '#FEE2E2', text: '#DC2626' },
  土: { bg: '#FEF3C7', text: '#D97706' },
};

export function BaziChart({ pillars }: BaziChartProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5 font-display tracking-[0.08em]">四柱命盘</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {pillarConfig.map(({ key, label }) => {
          const pillar = pillars[key];
          const isDay = key === 'day';
          const wuxingStyle = wuxingColorMap[pillar.ganWuxing] ?? { bg: '#F3F4F6', text: '#4B5563' };

          return (
            <div
              key={key}
              className={cn(
                'rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-card-hover',
                isDay
                  ? 'border-[#1C1A16]/35 bg-[#FFF7E8]'
                  : 'border-[#1C1A16]/10 bg-white'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-[#1C1A16]/65">{label}</div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: wuxingStyle.bg, color: wuxingStyle.text }}
                >
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: wuxingStyle.text }} />
                  {pillar.ganWuxing}
                </span>
              </div>
              <div className="text-2xl font-bold text-[#1C1A16] tracking-[0.08em]">
                {`${pillar.gan}${pillar.zhi}`}
              </div>
              <div className="mt-2 text-xs text-[#1C1A16]/60">{pillar.ganWuxing} / {pillar.zhiWuxing}</div>
              {isDay && (
                <span className="inline-flex items-center mt-3 bg-[#1C1A16] text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                  日主
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

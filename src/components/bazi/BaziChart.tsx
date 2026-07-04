'use client';

import type { PillarKey, PillarRecord } from '@/lib/bazi/types';
import { wuxingColor } from '@/data/wuxing';
import { cn } from '@/lib/utils/cn';

interface BaziChartProps {
  pillars: PillarRecord;
  /** 是否存在真实时柱；false 时时柱显示「未知」而非占位值 */
  hasHour?: boolean;
}

const pillarConfig: { key: PillarKey; label: string }[] = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

export function BaziChart({ pillars, hasHour = true }: BaziChartProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5 font-display tracking-[0.08em]">四柱命盘</h3>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {pillarConfig.map(({ key, label }) => {
          const pillar = pillars[key];
          const isDay = key === 'day';
          const isUnknownHour = key === 'hour' && !hasHour;
          const wuxingStyle = wuxingColor(pillar.ganWuxing);

          return (
            <div
              key={key}
              className={cn(
                'rounded-2xl border p-4 sm:p-5 transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-card-hover',
                isDay
                  ? 'border-brand-accent/40 bg-brand-accent-tint'
                  : isUnknownHour
                    ? 'border-dashed border-[#1C1A16]/20 bg-[#FAF9F6]'
                    : 'border-[#1C1A16]/10 bg-white'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-[#1C1A16]/65">{label}</div>
                {!isUnknownHour && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: wuxingStyle.bg, color: wuxingStyle.text }}
                  >
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: wuxingStyle.text }} />
                    {pillar.ganWuxing}
                  </span>
                )}
              </div>
              {isUnknownHour ? (
                <>
                  <div className="text-2xl font-bold text-brand-gray tracking-[0.08em]">未知</div>
                  <div className="mt-2 text-xs text-brand-gray">未提供出生时辰</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#1C1A16] tracking-[0.08em]">
                    {`${pillar.gan}${pillar.zhi}`}
                  </div>
                  <div className="mt-2 text-xs text-[#1C1A16]/60">{pillar.ganWuxing} / {pillar.zhiWuxing}</div>
                </>
              )}
              {isDay && (
                <span className="mt-3 inline-flex animate-pulse items-center rounded-full bg-brand-accent px-2 py-0.5 text-[11px] font-medium text-white">
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

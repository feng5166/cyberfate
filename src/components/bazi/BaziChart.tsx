'use client';

import { Card } from '@/components/ui/Card';
import type { TenGod } from '@/lib/bazi';
import { getTenGod } from '@/lib/bazi';

// 五行对应颜色
const wuxingColors: Record<string, string> = {
  '金': 'text-wuxing-metal',
  '木': 'text-wuxing-wood',
  '水': 'text-wuxing-water',
  '火': 'text-wuxing-fire',
  '土': 'text-wuxing-earth',
};

interface Pillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
  tenGod?: TenGod;
}

interface BaziChartProps {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
}

const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
const pillarKeys = ['year', 'month', 'day', 'hour'] as const;

export function BaziChart({ pillars }: BaziChartProps) {
  return (
    <Card variant="highlight" className="overflow-hidden">
      <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4 text-center">
        命盘四柱
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {pillarKeys.map((key, index) => {
          const pillar = pillars[key];
          const tenGod = pillar.tenGod ?? (key === 'day' ? '日主' : getTenGod(pillars.day.gan as any, pillar.gan as any));
          const isDay = key === 'day';
          return (
            <div key={key} className="text-center">
              <div className="text-xs text-text-muted mb-2">{pillarLabels[index]}</div>
              <div className={`bg-cyber-bg rounded-2xl p-3 sm:p-4 space-y-2 relative ${isDay ? 'ring-2 ring-[#FACC15]/60' : ''}`}>
                {isDay && (
                  <span className="absolute -top-2 right-3 text-[10px] font-semibold text-[#F59E0B] bg-white px-2 py-[2px] rounded-full shadow-sm">
                    日主
                  </span>
                )}
                {/* 天干 */}
                <div 
                  className={`text-2xl sm:text-3xl font-heading font-bold ${wuxingColors[pillar.ganWuxing] || 'text-text-primary'}`}
                >
                  {pillar.gan}
                </div>
                <div className="text-xs text-text-muted">{pillar.ganWuxing}</div>
                <div className="text-[11px] text-[#6B7280]">{tenGod}</div>
                {/* 分隔线 */}
                <div className="border-t border-cyber-gold/20" />
                {/* 地支 */}
                <div 
                  className={`text-2xl sm:text-3xl font-heading font-bold ${wuxingColors[pillar.zhiWuxing] || 'text-text-primary'}`}
                >
                  {pillar.zhi}
                </div>
                <div className="text-xs text-text-muted">{pillar.zhiWuxing}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

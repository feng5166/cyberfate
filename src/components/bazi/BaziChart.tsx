'use client';

import { Card } from '@/components/ui/Card';

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
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {pillarKeys.map((key, index) => {
          const pillar = pillars[key];
          return (
            <div key={key} className="text-center">
              <div className="text-xs text-text-muted mb-2">{pillarLabels[index]}</div>
              <div className="bg-cyber-bg rounded-lg p-3 sm:p-4 space-y-2">
                {/* 天干 */}
                <div 
                  className={`text-2xl sm:text-3xl font-heading font-bold ${wuxingColors[pillar.ganWuxing] || 'text-text-primary'}`}
                >
                  {pillar.gan}
                </div>
                <div className="text-xs text-text-muted">{pillar.ganWuxing}</div>
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

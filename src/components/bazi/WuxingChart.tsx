'use client';

import { Card } from '@/components/ui/Card';

interface WuxingCount {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

interface WuxingChartProps {
  wuxing: WuxingCount;
}

const wuxingConfig = [
  { key: 'metal', label: '金', color: 'bg-wuxing-metal', textColor: 'text-wuxing-metal' },
  { key: 'wood', label: '木', color: 'bg-wuxing-wood', textColor: 'text-wuxing-wood' },
  { key: 'water', label: '水', color: 'bg-wuxing-water', textColor: 'text-wuxing-water' },
  { key: 'fire', label: '火', color: 'bg-wuxing-fire', textColor: 'text-wuxing-fire' },
  { key: 'earth', label: '土', color: 'bg-wuxing-earth', textColor: 'text-wuxing-earth' },
] as const;

export function WuxingChart({ wuxing }: WuxingChartProps) {
  const total = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(wuxing), 1);

  return (
    <Card>
      <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
        五行分布
      </h3>
      <div className="space-y-4">
        {wuxingConfig.map(({ key, label, color, textColor }) => {
          const count = wuxing[key];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const barWidth = (count / maxCount) * 100;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={`font-medium ${textColor}`}>{label}</span>
                <span className="text-text-muted">
                  {count} 个 ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 bg-cyber-bg rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 五行分析提示 */}
      <div className="mt-4 pt-4 border-t border-cyber-gold/10">
        <p className="text-sm text-text-muted">
          {getWuxingAnalysis(wuxing)}
        </p>
      </div>
    </Card>
  );
}

function getWuxingAnalysis(wuxing: WuxingCount): string {
  const entries = Object.entries(wuxing) as [keyof WuxingCount, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [strongest] = sorted[0];
  const weakest = sorted.filter(([, v]) => v === sorted[sorted.length - 1][1]).map(([k]) => k);
  
  const labels: Record<keyof WuxingCount, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  };
  
  if (sorted[sorted.length - 1][1] === 0) {
    return `五行缺${weakest.map(k => labels[k]).join('、')}，${labels[strongest]}旺。`;
  }
  
  return `${labels[strongest]}旺，五行较为${sorted[0][1] - sorted[sorted.length - 1][1] <= 2 ? '平衡' : '偏向'}。`;
}

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
  { key: 'metal', label: '金', color: '#7C3AED', bg: '#F3E8FF' },
  { key: 'wood', label: '木', color: '#047857', bg: '#D1FAE5' },
  { key: 'water', label: '水', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'fire', label: '火', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'earth', label: '土', color: '#D97706', bg: '#FEF3C7' },
] as const;

export function WuxingChart({ wuxing }: WuxingChartProps) {
  const total = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(wuxing), 1);
  const avg = total > 0 ? total / wuxingConfig.length : 0;
  const balanceScore = maxCount ? Math.round((1 - (maxCount - avg) / Math.max(maxCount, 1)) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-cyber-gold">五行属性图谱</h3>
        <span className="text-xs text-text-muted">平衡指数 {Math.max(0, Math.min(balanceScore, 100))}%</span>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        {wuxingConfig.map(({ key, label, color, bg }) => {
          const count = wuxing[key];
          const status = count >= avg ? '旺' : '弱';
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: bg, color }}
            >
              {label} · {status}
            </span>
          );
        })}
      </div>
      <div className="space-y-4">
        {wuxingConfig.map(({ key, label, color }) => {
          const count = wuxing[key];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const barWidth = (count / maxCount) * 100;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium" style={{ color }}>{label}</span>
                <span className="text-text-muted">
                  {count} 个 ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 bg-cyber-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 五行分析提示 */}
      <div className="mt-5 pt-4 border-t border-cyber-gold/10 space-y-1 text-sm text-text-muted">
        <p>{getWuxingAnalysis(wuxing)}</p>
        <p>建议：保持旺项优势，并通过作息与行动补足偏弱之行。</p>
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

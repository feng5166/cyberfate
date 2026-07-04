'use client';

import { WUXING } from '@/data/wuxing';

interface WuxingCount {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

interface RadarChartProps {
  wuxing: WuxingCount;
  size?: number;
  className?: string;
}

// 轴标签配色统一取自五行配色真源（@/data/wuxing 的 .text，白底达 AA）。
const AXES: Array<{ key: keyof WuxingCount; label: string; color: string }> = [
  { key: 'wood', label: '木', color: WUXING.wood.text },
  { key: 'fire', label: '火', color: WUXING.fire.text },
  { key: 'earth', label: '土', color: WUXING.earth.text },
  { key: 'metal', label: '金', color: WUXING.metal.text },
  { key: 'water', label: '水', color: WUXING.water.text },
];

export function RadarChart({ wuxing, size = 220, className = '' }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 28;

  const values = AXES.map((a) => wuxing[a.key] || 0);
  const max = Math.max(4, ...values);

  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;

  const pointAt = (i: number, ratio: number) => {
    const angle = angleAt(i);
    return {
      x: cx + Math.cos(angle) * maxRadius * ratio,
      y: cy + Math.sin(angle) * maxRadius * ratio,
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = values.map((v, i) => pointAt(i, v / max));
  const dataPath = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="五行雷达图"
    >
      {gridLevels.map((lvl, idx) => {
        const pts = AXES.map((_, i) => pointAt(i, lvl))
          .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
          .join(' ');
        return (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="#E5E0D8"
            strokeWidth={1}
          />
        );
      })}

      {AXES.map((_, i) => {
        const p = pointAt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#E5E0D8"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={dataPath}
        fill="#1C1A16"
        fillOpacity={0.18}
        stroke="#1C1A16"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="#FFFFFF"
          stroke="#1C1A16"
          strokeWidth={2}
        />
      ))}

      {AXES.map((axis, i) => {
        const p = pointAt(i, 1.18);
        const cnt = values[i];
        return (
          <g key={axis.key}>
            <text
              x={p.x}
              y={p.y - 4}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill={axis.color}
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
            <text
              x={p.x}
              y={p.y + 10}
              textAnchor="middle"
              fontSize={10}
              fill="#1C1A16"
              opacity={0.5}
              dominantBaseline="middle"
            >
              {cnt}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

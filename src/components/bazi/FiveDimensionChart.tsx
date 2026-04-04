'use client';

interface FiveDimensionProps {
  dimensions: {
    career: number;
    wealth: number;
    relationship: number;
    health: number;
    studies: number;
  };
}

const dimensionConfig: Array<{ key: keyof FiveDimensionProps['dimensions']; label: string; color: string }> = [
  { key: 'career', label: '事业运', color: '#3B82F6' },
  { key: 'wealth', label: '财富运', color: '#EAB308' },
  { key: 'relationship', label: '感情运', color: '#EC4899' },
  { key: 'health', label: '健康运', color: '#22C55E' },
  { key: 'studies', label: '学业运', color: '#6366F1' },
];

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function FiveDimensionChart({ dimensions }: FiveDimensionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1C1A16] mb-5">五维运势评分</h3>
      <div className="space-y-3">
        {dimensionConfig.map(({ key, label, color }) => {
          const score = clampScore(dimensions[key]);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 text-sm text-[#1C1A16]/70">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-8 text-sm text-right text-[#1C1A16]">{score}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

'use client';

interface Pillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
}

interface PillarTableProps {
  chart: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  title?: string;
  subtitle?: string;
  className?: string;
}

const WUXING_COLOR: Record<string, string> = {
  '木': '#3F8C5C',
  '火': '#C2422C',
  '土': '#A57842',
  '金': '#A89A6F',
  '水': '#3B6A8A',
};

const COLUMNS: Array<{ key: 'year' | 'month' | 'day' | 'hour'; label: string; stage: string }> = [
  { key: 'year', label: '年柱', stage: '童年到青年' },
  { key: 'month', label: '月柱', stage: '成年基础运' },
  { key: 'day', label: '日柱', stage: '自身性格' },
  { key: 'hour', label: '时柱', stage: '中年到晚年' },
];

export function PillarTable({ chart, title, subtitle, className = '' }: PillarTableProps) {
  return (
    <div className={`rounded-2xl border border-[#E5E0D8] bg-white p-5 md:p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="text-base font-semibold text-[#1C1A16]">{title}</h4>}
          {subtitle && <p className="text-xs text-[#1C1A16]/55 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map((col) => {
          const pillar = chart[col.key];
          return (
            <div key={col.key} className="text-center">
              <div className="text-[11px] text-[#1C1A16]/55 mb-1 font-medium tracking-wide">
                {col.label}
              </div>
              <div className="text-[10px] text-[#1C1A16]/40 mb-3">{col.stage}</div>

              {pillar ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF9F6] py-3">
                    <div
                      className="text-2xl md:text-[28px] font-semibold leading-none"
                      style={{
                        fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif',
                        color: WUXING_COLOR[pillar.ganWuxing] || '#1C1A16',
                      }}
                    >
                      {pillar.gan}
                    </div>
                    <div
                      className="text-[10px] mt-1.5"
                      style={{ color: WUXING_COLOR[pillar.ganWuxing] || '#1C1A16' }}
                    >
                      {pillar.ganWuxing}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF9F6] py-3">
                    <div
                      className="text-2xl md:text-[28px] font-semibold leading-none"
                      style={{
                        fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif',
                        color: WUXING_COLOR[pillar.zhiWuxing] || '#1C1A16',
                      }}
                    >
                      {pillar.zhi}
                    </div>
                    <div
                      className="text-[10px] mt-1.5"
                      style={{ color: WUXING_COLOR[pillar.zhiWuxing] || '#1C1A16' }}
                    >
                      {pillar.zhiWuxing}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-dashed border-[#E5E0D8] py-3 text-[#1C1A16]/30 text-sm">
                    —
                  </div>
                  <div className="rounded-lg border border-dashed border-[#E5E0D8] py-3 text-[#1C1A16]/30 text-sm">
                    —
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

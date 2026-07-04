'use client';

interface HiddenItem {
  gan: string;
  god: string;
  ratio: number;
  position: 'main' | 'middle' | 'rest';
  represent: string;
  trait: string;
}

interface PillarShishen {
  ganGod: string;
  ganRepresent: string;
  ganTrait: string;
  hidden: HiddenItem[];
}

interface SideShishen {
  year: PillarShishen | null;
  month: PillarShishen | null;
  day: PillarShishen | null;
  hour: PillarShishen | null;
}

interface ShishenSectionProps {
  side: SideShishen;
  summary: { counts: Record<string, number>; text: string };
  title: string;
  subtitle?: string;
}

const PILLAR_COLS: Array<{ key: 'year' | 'month' | 'day' | 'hour'; label: string; stage: string }> = [
  { key: 'year', label: '年柱', stage: '童年到青年' },
  { key: 'month', label: '月柱', stage: '成年基础运' },
  { key: 'day', label: '日柱', stage: '自身性格' },
  { key: 'hour', label: '时柱', stage: '中年到晚年' },
];

function ShishenCard({
  god,
  hiddenLabel,
  ratio,
  represent,
  trait,
  isMain,
}: {
  god: string;
  hiddenLabel?: string;
  ratio: number;
  represent: string;
  trait: string;
  isMain: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isMain
          ? 'bg-[#FAF9F6] border-[#C2762B]/30'
          : 'bg-white border-[#E5E0D8]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-sm font-semibold ${isMain ? 'text-[#C2762B]' : 'text-[#1C1A16]'}`}
          >
            {god === '日主' ? '日主' : god}
          </span>
          {hiddenLabel && (
            <span className="text-[10px] text-brand-gray px-1.5 py-0.5 rounded bg-[#F3EFE8]">
              {hiddenLabel}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#1C1A16]/55 tabular-nums">{ratio}%</span>
      </div>
      <p className="text-[11px] leading-5 text-[#1C1A16]/70 mb-1">
        <span className="text-brand-gray">代表：</span>
        {represent}
      </p>
      <p className="text-[11px] leading-5 text-[#1C1A16]/70">
        <span className="text-brand-gray">表现特征：</span>
        {trait}
      </p>
    </div>
  );
}

export function ShishenSection({ side, summary, title, subtitle }: ShishenSectionProps) {
  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 md:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#1C1A16]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#1C1A16]/55 mt-1">{subtitle}</p>
        )}
      </div>

      {/* 半宽并排下四柱走 2 列（=移动端 <md 的 2 列，不再 md:4 列避免拥挤） */}
      <div className="grid grid-cols-2 gap-3">
        {PILLAR_COLS.map((col) => {
          const p = side[col.key];
          return (
            <div key={col.key} className="space-y-2">
              <div className="text-center pb-2 border-b border-[#E5E0D8]">
                <p className="text-sm font-semibold text-[#1C1A16]">{col.label}</p>
                <p className="text-[10px] text-[#1C1A16]/50 mt-0.5">{col.stage}</p>
              </div>

              {p ? (
                <div className="space-y-2">
                  <ShishenCard
                    god={p.ganGod}
                    ratio={100}
                    represent={p.ganRepresent}
                    trait={p.ganTrait}
                    isMain
                  />
                  {p.hidden.map((h, idx) => (
                    <ShishenCard
                      key={`${h.gan}-${idx}`}
                      god={h.god}
                      hiddenLabel={`藏${h.gan}`}
                      ratio={h.ratio}
                      represent={h.represent}
                      trait={h.trait}
                      isMain={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E5E0D8] py-4 text-center text-xs text-[#1C1A16]/40">
                  时辰未提供
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] p-4">
        <p className="text-sm font-semibold text-[#1C1A16] mb-2">总体特征分析</p>
        <p className="text-xs text-[#1C1A16]/70 leading-6">{summary.text}</p>
      </div>
    </div>
  );
}

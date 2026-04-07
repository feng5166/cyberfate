'use client';

interface DayMasterSummaryCardProps {
  dayMaster: string;
  personality: string;
  favorableGods: string[];
  avoidGods: string[];
}

function renderFallback(values: string[]): string {
  const filtered = values.map(v => v.trim()).filter(Boolean);
  return filtered.length ? filtered.join('、') : '—';
}

export function DayMasterSummaryCard({
  dayMaster,
  personality,
  favorableGods,
  avoidGods,
}: DayMasterSummaryCardProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-[#FFF7EA] via-[#FFFCF5] to-[#FDF4E6] p-5 md:p-6">
      <div className="border-l-4 border-[#1C1A16] pl-4">
        <h3 className="text-lg font-semibold text-[#1C1A16] font-display">
          你是「{dayMaster || '—'}命人」
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1A16]/82">
          {personality || '命理画像生成中，请稍后重试。'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[#1C1A16]/70">喜用神：</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            {renderFallback(favorableGods)}
          </span>
          <span className="ml-1 text-[#1C1A16]/70">忌神：</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
            {renderFallback(avoidGods)}
          </span>
        </div>
      </div>
    </section>
  );
}

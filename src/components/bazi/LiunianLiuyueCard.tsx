import type { FlowAnalysis, LiuyueItem, FlowBranchRelation } from '@/lib/bazi/liunian';

/** 把流年/流月与命局的刑冲会合压成一行短摘要，如「日支午冲、月支酉合」 */
function relSummary(interactions: FlowBranchRelation[]): string {
  if (!interactions.length) return '—';
  return interactions
    .map((it) => `${it.with}${it.relations.map((r) => r.type).join('/')}`)
    .join('、');
}

function hiddenSummary(flow: FlowAnalysis): string {
  return flow.zhiHiddenTenGods.map((h) => `${h.gan}(${h.tenGod})`).join(' ');
}

export function LiunianLiuyueCard({
  liunian,
  liuyue,
  year,
}: {
  liunian?: FlowAnalysis;
  liuyue?: LiuyueItem[];
  year?: number;
}) {
  if (!liunian && !liuyue?.length) return null;
  const y = year ?? liuyue?.[0]?.year;

  return (
    <div>
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">流年流月</h3>
      <p className="text-xs text-brand-gray mb-4">当前公历年的流年干支及十二流月与命盘的作用关系</p>

      {/* 流年概览 */}
      {liunian && (
        <div className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] p-4 mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-semibold text-[#8B3A2A]">{y} 流年</span>
            <span className="text-lg font-bold text-[#1C1A16] tracking-wide">{liunian.ganzhi}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[#1C1A16]/70">
            <p>
              <span className="text-brand-gray">天干十神：</span>
              {liunian.gan}（{liunian.ganTenGod}）
            </p>
            <p>
              <span className="text-brand-gray">地支藏干：</span>
              {hiddenSummary(liunian)}
            </p>
            <p className="sm:col-span-2">
              <span className="text-brand-gray">与命局：</span>
              {relSummary(liunian.interactions)}
            </p>
            {liunian.shensha.length > 0 && (
              <p className="sm:col-span-2">
                <span className="text-brand-gray">引动神煞：</span>
                {liunian.shensha.map((s) => `${s.name}(${s.type})`).join('、')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 流月表 */}
      {liuyue && liuyue.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-brand-gray border-b border-[#1C1A16]/8">
                <th className="py-2 px-2 text-left font-medium">月份</th>
                <th className="py-2 px-2 text-left font-medium">流月</th>
                <th className="py-2 px-2 text-left font-medium">主十神</th>
                <th className="py-2 px-2 text-left font-medium">与命局作用</th>
              </tr>
            </thead>
            <tbody>
              {liuyue.map((m) => (
                <tr key={`${m.year}-${m.month}`} className="border-b border-[#1C1A16]/5">
                  <td className="py-2 px-2 text-[#1C1A16]/70 whitespace-nowrap">{m.month} 月</td>
                  <td className="py-2 px-2 font-semibold text-[#1C1A16] whitespace-nowrap">{m.ganzhi}</td>
                  <td className="py-2 px-2 text-[#1C1A16]/70 whitespace-nowrap">{m.ganTenGod}</td>
                  <td className="py-2 px-2 text-[#1C1A16]/55">{relSummary(m.interactions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

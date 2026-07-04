import type { ShenshaDisplay } from '@/lib/bazi/types';

const PILLAR_LABEL: Record<string, string> = { year: '年', month: '月', day: '日', hour: '时' };

const NATURE_ORDER: Record<string, number> = { 吉: 0, 中: 1, 凶: 2 };

const NATURE_STYLE: Record<string, string> = {
  吉: 'border-emerald-300/60 bg-emerald-50 text-emerald-700',
  中: 'border-amber-300/50 bg-[#FFFBF5] text-[#B8791F]',
  凶: 'border-red-300/50 bg-red-50 text-red-600',
};

const NATURE_DOT: Record<string, string> = {
  吉: 'bg-emerald-500',
  中: 'bg-amber-400',
  凶: 'bg-red-400',
};

interface Aggregated {
  name: string;
  nature: ShenshaDisplay['nature'];
  pillars: string[];
}

/** 同名神煞合并柱位（年支/日支取法可能命中多柱），按吉→中→凶排序展示。 */
function aggregate(shensha: ShenshaDisplay[]): Aggregated[] {
  const map = new Map<string, Aggregated>();
  for (const s of shensha) {
    const cur = map.get(s.name) ?? { name: s.name, nature: s.nature, pillars: [] };
    for (const p of s.pillars) {
      const label = PILLAR_LABEL[p] ?? p;
      if (!cur.pillars.includes(label)) cur.pillars.push(label);
    }
    map.set(s.name, cur);
  }
  return [...map.values()].sort(
    (a, b) => (NATURE_ORDER[a.nature] ?? 1) - (NATURE_ORDER[b.nature] ?? 1),
  );
}

export function ShenshaCard({ shensha }: { shensha?: ShenshaDisplay[] }) {
  const items = shensha?.length ? aggregate(shensha) : [];

  return (
    <div>
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">神煞分析</h3>
      <p className="text-xs text-brand-gray mb-4">命盘所带神煞，吉神助力、凶煞需防，中性者吉凶随用忌而定</p>

      {items.length === 0 ? (
        <p className="text-sm text-brand-gray">命盘未见常用神煞</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.name}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                NATURE_STYLE[item.nature] ?? NATURE_STYLE['中']
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${NATURE_DOT[item.nature] ?? NATURE_DOT['中']}`} />
              {item.name}
              <span className="text-[10px] opacity-60">{item.pillars.join('')}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

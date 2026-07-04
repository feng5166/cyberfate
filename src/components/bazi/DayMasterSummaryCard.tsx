'use client';

import type { WuXing } from '@/lib/bazi/types';
import { wuxingColor } from '@/data/wuxing';

interface MingGeDisplayInfo {
  geju: string;
  rizhuStrength: '偏强' | '中和' | '偏弱';
  yongShen: WuXing;
  jiShen: WuXing;
  yongShenAll?: WuXing[];
  jiShenAll?: WuXing[];
}

interface DayMasterSummaryCardProps {
  dayMaster: string;
  personality: string;
  favorableGods: string[];
  avoidGods: string[];
  mingGe?: MingGeDisplayInfo;
}

function renderFallback(values: string[]): string {
  const filtered = values.map(v => v.trim()).filter(Boolean);
  return filtered.length ? filtered.join('、') : '—';
}

function WuxingDot({ wuxing }: { wuxing: WuXing }) {
  const color = wuxingColor(wuxing).hex;
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle"
      style={{ backgroundColor: color }}
      aria-label={`${wuxing}行`}
    />
  );
}

export function DayMasterSummaryCard({
  dayMaster,
  personality,
  favorableGods,
  avoidGods,
  mingGe,
}: DayMasterSummaryCardProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-[#FFF7EA] via-[#FFFCF5] to-[#FDF4E6] p-5 md:p-6">
      <div className="border-l-4 border-brand-accent pl-4">
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

        {mingGe && (
          <div className="mt-3 pt-3 border-t border-[#1C1A16]/8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="text-[#1C1A16]/60">命格：</span>
              <span className="font-semibold text-[#1C1A16]">{mingGe.geju}</span>

              <span className="hidden sm:inline text-[#1C1A16]/20">|</span>

              <span className="text-[#1C1A16]/60">日主：</span>
              <span className="font-medium text-[#1C1A16]">{mingGe.rizhuStrength}</span>

              <span className="hidden sm:inline text-[#1C1A16]/20">|</span>

              <span className="text-[#1C1A16]/60">用神：</span>
              <span className="inline-flex items-center gap-2 font-medium text-[#1C1A16]">
                {(mingGe.yongShenAll?.length ? mingGe.yongShenAll : [mingGe.yongShen]).map((w) => (
                  <span key={`ys-${w}`} className="inline-flex items-center">
                    <WuxingDot wuxing={w} />{w}
                  </span>
                ))}
              </span>

              <span className="hidden sm:inline text-[#1C1A16]/20">|</span>

              <span className="text-[#1C1A16]/60">忌神：</span>
              <span className="inline-flex items-center gap-2 font-medium text-[#1C1A16]">
                {(mingGe.jiShenAll?.length ? mingGe.jiShenAll : [mingGe.jiShen]).map((w) => (
                  <span key={`js-${w}`} className="inline-flex items-center">
                    <WuxingDot wuxing={w} />{w}
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

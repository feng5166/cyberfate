'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import type { SihuaNarrativeItem } from '@/lib/ziwei/quickRead';
import { track } from '@/lib/analytics';

/**
 * 生年四化叙事卡（PRD-ZIWEI-V2 P1-A）：
 * 禄=财源机遇 / 权=掌控力 / 科=名声贵人 / 忌=人生功课。
 * 真实排盘数据 + 确定性模板，替换 V1 的硬编码假四化动画文案。
 */

const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  化禄: { color: '#059669', bg: '#ECFDF5' },
  化权: { color: '#1D4ED8', bg: '#EFF6FF' },
  化科: { color: '#7E22CE', bg: '#F5F3FF' },
  化忌: { color: '#B0870F', bg: '#FFFBEB' }, // 「功课」框架用琥珀，不用红色恐吓
};

export function SihuaNarrativeCard({ items, className }: { items: SihuaNarrativeItem[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || trackedRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !trackedRef.current) {
        trackedRef.current = true;
        track('ziwei_sihua_view');
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn('bg-white rounded-2xl border border-[#1C1A16]/8 p-5 sm:p-6', className)}
      role="region"
      aria-label="生年四化"
    >
      <h3 className="text-base font-semibold text-[#1C1A16] mb-1">生年四化 · 你的四条人生线索</h3>
      <p className="text-xs text-[#1C1A16]/45 mb-4">
        由出生年干确定性推得，禄权科忌各主一事——机遇、掌控、名声与功课
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const style = TYPE_STYLE[item.type] ?? TYPE_STYLE['化科'];
          return (
            <div
              key={item.type}
              className="rounded-xl border border-[#1C1A16]/6 p-4"
              style={{ background: style.bg }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[13px] font-bold text-white"
                  style={{ background: style.color }}
                >
                  {item.short}
                </span>
                <span className="text-sm font-semibold text-[#1C1A16]">
                  {item.star}{item.type}
                  {item.palaceName && <span className="text-[#1C1A16]/55 font-normal"> · 落{item.palaceName}宫</span>}
                </span>
                <span className="ml-auto text-[11px]" style={{ color: style.color }}>{item.theme}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#1C1A16]/70">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

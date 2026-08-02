'use client';

import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * 命盘速读（PRD-ZIWEI-V2 P0-A）：排盘后 3 秒读懂
 * 「我是什么盘、身宫在哪、这十年走什么大限」。纯模板合成，零 AI 成本。
 */
export function ZiweiQuickReadCard({ lines }: { lines: string[] }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current || lines.length === 0) return;
    trackedRef.current = true;
    track('ziwei_quickread_show', { lines: lines.length });
  }, [lines]);

  if (lines.length === 0) return null;

  const markers = ['盘', '身', '限'];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-5 sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -right-2 -bottom-4 font-display text-[56px] text-[#1C1A16]/[0.05]"
      >
        紫
      </span>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: '#F3E8FF' }}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#7E22CE' }} />
        </span>
        <h3 className="text-base font-semibold text-[#1C1A16]">命盘速读</h3>
        <span className="text-[11px] text-[#1C1A16]/45">30 秒看懂你的盘</span>
      </div>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium"
              style={{ background: '#F3E8FF', color: '#7E22CE' }}
            >
              {markers[i] ?? i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[#1C1A16]/80">{line}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

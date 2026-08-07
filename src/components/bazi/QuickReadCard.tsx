'use client';

import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * 命盘速读（PRD-BAZI-V2 P0-A）：排盘后 3 秒内让用户知道
 * 「我是什么盘、现在什么处境、今年怎么样」。纯模板合成，零 AI 成本。
 */
export function QuickReadCard({ lines }: { lines: string[] }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current || lines.length === 0) return;
    trackedRef.current = true;
    track('bazi_quickread_show', { lines: lines.length });
  }, [lines]);

  if (lines.length === 0) return null;

  const markers = ['盘', '运', '年'];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-5 sm:p-6">
      {/* 干支水印装饰 */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -right-2 -bottom-4 font-display text-[56px] text-[#1C1A16]/[0.05]"
      >
        命
      </span>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: '#DBEAFE' }}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
        </span>
        <h3 className="text-base font-semibold text-[#1C1A16]">命盘速读</h3>
        <span className="text-[11px] text-[#1C1A16]/45">30 秒看懂你的盘</span>
      </div>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}
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

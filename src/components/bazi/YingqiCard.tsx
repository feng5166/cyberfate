'use client';

import { useEffect, useRef } from 'react';
import { CalendarClock, Lock } from 'lucide-react';
import type { YingqiItem, YingqiKind } from '@/lib/bazi/yingqi';
import { track } from '@/lib/analytics';

/**
 * 关键应期卡（PRD-BAZI-V2 P1-D）：未来 10 年确定性应期扫描。
 * 免费显示最近 1 条 + 模糊占位；VIP 全表按年份排。
 * 谨慎年措辞一律「提醒-蓄力」框架。
 */

const KIND_STYLE: Record<YingqiKind, { bg: string; fg: string }> = {
  婚缘: { bg: '#FCE7F3', fg: '#BE185D' },
  事业: { bg: '#DBEAFE', fg: '#1D4ED8' },
  财运: { bg: '#FBF1D0', fg: '#B0870F' },
  谨慎: { bg: '#F5F3EF', fg: '#6B7280' },
};

interface YingqiCardProps {
  items: YingqiItem[];
  /** 全表条数（免费用户 items 只有 1 条时用于展示「还有 N 条」） */
  total: number;
  isVip: boolean;
  onUnlockClick: () => void;
}

export function YingqiCard({ items, total, isVip, onUnlockClick }: YingqiCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || trackedRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !trackedRef.current) {
        trackedRef.current = true;
        track('bazi_yingqi_view', { total, is_vip: isVip });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [total, isVip]);

  const lockedCount = Math.max(0, total - items.length);

  return (
    <div ref={ref}>
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="w-4 h-4" strokeWidth={1.5} style={{ color: '#1D4ED8' }} />
        <h3 className="text-base font-semibold text-[#1C1A16]">关键应期 · 未来十年</h3>
      </div>
      <p className="text-xs text-brand-gray mb-4">
        婚缘 / 事业 / 财运在哪一年更容易落定，本地确定性推算，非 AI 生成
      </p>

      {total === 0 ? (
        <div className="rounded-xl bg-[#FAF9F6] border border-[#1C1A16]/6 px-4 py-5 text-center">
          <p className="text-sm text-[#1C1A16]/70">未来十年流年平缓，没有特别突出的应期节点</p>
          <p className="text-xs text-[#1C1A16]/45 mt-1">平缓即从容——按自己的节奏积累，机会来时更接得住。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const style = KIND_STYLE[item.kind];
            return (
              <div
                key={`${item.year}_${item.kind}_${i}`}
                className="flex items-start gap-3 rounded-xl border border-[#1C1A16]/6 bg-[#FAF9F6] px-4 py-3"
              >
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-base font-semibold text-[#1C1A16]">{item.year}</p>
                  <p className="text-[10px] text-[#1C1A16]/45 tracking-[0.08em]">{item.ganzhi}</p>
                </div>
                <div className="min-w-0 pt-0.5">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {item.kind === '谨慎' ? '稳字当头' : item.kind}
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-[#1C1A16]/65">{item.reason}</p>
                </div>
              </div>
            );
          })}

          {/* 非 VIP：模糊占位 + 解锁 */}
          {!isVip && lockedCount > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-[#1C1A16]/8">
              <div className="space-y-2 p-3 select-none blur-[6px]" aria-hidden>
                {Array.from({ length: Math.min(lockedCount, 3) }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-[#FAF9F6] px-4 py-3">
                    <div className="w-14 text-center">
                      <p className="text-base font-semibold text-[#1C1A16]">20××</p>
                      <p className="text-[10px] text-[#1C1A16]/45">××</p>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] text-[#1D4ED8]">应期</span>
                      <p className="mt-1 text-xs text-[#1C1A16]/60">流年星曜透干，对应人生大事易有实质进展</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/55">
                <p className="text-xs text-[#1C1A16]/70">还有 {lockedCount} 条应期未解锁</p>
                <button
                  type="button"
                  onClick={() => {
                    track('bazi_yingqi_paywall_click');
                    onUnlockClick();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-4 py-2 text-xs font-medium text-white hover:bg-brand-accent-hover transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  解锁完整应期表
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] text-[#1C1A16]/40">
        应期为传统命理推算的「更容易发生」的时间窗口，不构成任何决策承诺；把它当成提前布局的提醒即可。
      </p>
    </div>
  );
}

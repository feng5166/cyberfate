'use client';

import type { DayunTimelineItem } from '@/lib/bazi/types';
import { getTenGod } from '@/lib/bazi/helpers';
import type { TianGan } from '@/lib/bazi/types';
import { cn } from '@/lib/utils/cn';

interface DayunTimelineProps {
  timeline: DayunTimelineItem[];
  dayGan: TianGan;
  className?: string;
}

/**
 * 判断大运旺衰
 * 简化规则：当前大运五行与日主五行的关系
 */
function getDayunStatus(dayunWuxing: string, dayGanWuxing: string): '吉' | '平' | '凶' {
  // 简化判断：生我、助我为吉，克我为凶，其他为平
  const wuxingGenerate: Record<string, string> = {
    '金': '水', '水': '木', '木': '火', '火': '土', '土': '金',
  };
  const wuxingControl: Record<string, string> = {
    '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
  };

  if (wuxingGenerate[dayunWuxing] === dayGanWuxing || dayunWuxing === dayGanWuxing) {
    return '吉';
  }
  if (wuxingControl[dayunWuxing] === dayGanWuxing) {
    return '凶';
  }
  return '平';
}

export function DayunTimeline({ timeline, dayGan, className }: DayunTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className={cn('text-sm text-[#1C1A16]/50 text-center py-8', className)}>
        暂无大运数据
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {timeline.map((item) => {
        const tenGod = getTenGod(dayGan, item.gan);
        const status = getDayunStatus(item.wuxing, dayGan);

        const statusColors = {
          '吉': 'bg-emerald-100 text-emerald-700',
          '平': 'bg-gray-100 text-gray-600',
          '凶': 'bg-red-100 text-red-700',
        };

        return (
          <div
            key={item.index}
            className={cn(
              'rounded-xl border p-4 transition-all duration-200',
              item.isCurrent
                ? 'border-l-4 border-l-[#1C1A16] bg-[rgba(28,26,22,0.02)] border-[rgba(28,26,22,0.15)]'
                : 'border-[rgba(28,26,22,0.06)] hover:-translate-y-0.5 hover:shadow-sm'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {/* 左侧：序号 + 年龄 + 干支 + 十神 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-[#1C1A16]/50 w-20">
                    第{['一', '二', '三', '四', '五', '六'][item.index] || item.index + 1}步大运
                  </span>
                  <span className="text-sm font-medium text-[#1C1A16]">
                    {item.ageStart}岁 ~ {item.ageEnd}岁
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-[#1C1A16]">
                    {item.gan}{item.zhi}
                  </span>
                  <span className="text-sm text-[#1C1A16]/70">
                    {tenGod}
                  </span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded', statusColors[status])}>
                    {status}
                  </span>
                </div>

                {item.isCurrent && (
                  <p className="mt-2 text-xs text-[#1C1A16]/60">
                    ✓ 当前正在经历该阶段
                  </p>
                )}
              </div>

              {/* 右侧：运势描述（预留，后续可接 AI）*/}
              <div className="hidden md:block flex-1 min-w-0">
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
                  {status === '吉' && '运势顺遂，宜顺势而为。'}
                  {status === '平' && '平稳过渡，保持节奏。'}
                  {status === '凶' && '需谨慎应对，稳中求进。'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

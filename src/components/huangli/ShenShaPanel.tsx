'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import type { HuangliData } from '@/lib/huangli/calculator';

interface ShenShaPanelProps {
  data: HuangliData;
}

export function ShenShaPanel({ data }: ShenShaPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const rows = [
    { label: '胎神', value: data.taishen },
    { label: '彭祖百忌', value: `${data.pengzuGan}；${data.pengzuZhi}` },
    { label: '二十八宿', value: `${data.xiu}宿（${data.xiuLuck}）` },
    {
      label: '吉神宜趋',
      value: data.jiShen,
      isList: true,
      color: 'green' as const,
    },
    {
      label: '凶神宜忌',
      value: data.xiongSha,
      isList: true,
      color: 'red' as const,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#1C1A16]/8 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAF9F6] transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-[#1C1A16]">
          <span
            aria-hidden
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#FEE2E2' }}
          >
            <ScrollText className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#DC2626' }} />
          </span>
          详细黄历数据
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-[#1C1A16]/40" />
          : <ChevronDown className="w-4 h-4 text-[#1C1A16]/40" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#1C1A16]/8 pt-4">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col sm:flex-row sm:items-start gap-1">
              <span className="text-xs font-medium text-[#1C1A16]/50 sm:w-20 sm:flex-shrink-0">
                {row.label}
              </span>
              {row.isList && Array.isArray(row.value) ? (
                <div className="flex flex-wrap gap-1.5">
                  {(row.value as string[]).map((item, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-xs ${
                        row.color === 'green'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-[#1C1A16]/70">{row.value as string}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

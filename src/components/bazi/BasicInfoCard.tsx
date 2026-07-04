'use client';

import { useState } from 'react';
import { Check, Copy, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BasicInfoCardProps {
  baziText: string;
  name: string;
  gender: string;
  birthTime: string;
  lunarDate: string;
  zodiac: string;
  dayunStartDescription: string;
  dayunStartAt: string;
  isAuthenticated: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReanalyze?: () => void;
  reanalyzing?: boolean;
}

interface InfoRow {
  label: string;
  value: string;
  secondaryValue?: string;
}

const mutedText = 'text-brand-gray';

function normalizeText(value: string): string {
  return value.trim() || '—';
}

export function BasicInfoCard({
  baziText,
  name,
  gender,
  birthTime,
  lunarDate,
  zodiac,
  dayunStartDescription,
  dayunStartAt,
  isAuthenticated,
  onEdit,
  onDelete,
  onReanalyze,
  reanalyzing = false,
}: BasicInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const rows: InfoRow[] = [
    { label: '姓名', value: isAuthenticated ? normalizeText(name) : '—' },
    { label: '性别', value: normalizeText(gender) },
    { label: '出生时间', value: normalizeText(birthTime) },
    { label: '对应农历', value: normalizeText(lunarDate) },
    { label: '生肖', value: normalizeText(zodiac) },
    {
      label: '大运起运',
      value: normalizeText(dayunStartDescription),
      secondaryValue: normalizeText(dayunStartAt),
    },
  ];

  const handleCopy = async () => {
    if (!baziText.trim()) return;
    try {
      await navigator.clipboard.writeText(baziText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error('Failed to copy bazi text:', error);
    }
  };

  const handleDelete = () => {
    if (!window.confirm('确认删除当前结果并返回空白态吗？')) return;
    onDelete();
  };

  return (
    <section className="rounded-2xl bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1C1A16]">基本信息</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="编辑"
            onClick={onEdit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(28,26,22,0.52)] transition-colors hover:bg-[#1C1A16]/5 hover:text-[#1C1A16]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="删除"
            onClick={handleDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(28,26,22,0.52)] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {onReanalyze && (
            <button
              type="button"
              aria-label="重新分析"
              onClick={onReanalyze}
              disabled={reanalyzing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(28,26,22,0.52)] transition-colors hover:bg-[#1C1A16]/5 hover:text-[#1C1A16] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={cn('text-sm', mutedText)}>八字</p>
          <p className="mt-1 break-words font-mono text-xl font-semibold tracking-[0.08em] text-[#1C1A16] md:text-2xl">
            {normalizeText(baziText)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-[#1C1A16]/15 px-2.5 text-xs text-[#1C1A16]/75 transition-colors hover:bg-[#1C1A16]/5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制八字'}
        </button>
      </div>

      <div className="my-4 h-px bg-[rgba(28,26,22,0.08)]" />

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <span className={cn('text-sm sm:w-24', mutedText)}>{row.label}</span>
            <div className="text-sm font-medium text-[#1C1A16] sm:text-right">
              <p>{row.value}</p>
              {row.secondaryValue && <p className="mt-0.5 text-[13px] text-[#1C1A16]/72">{row.secondaryValue}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

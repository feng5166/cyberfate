'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getNaYin } from '@/lib/bazi/helpers';
import type { BaziHistoryRecord } from '@/lib/bazi/types';
import { deleteRecord, loadRecords } from '@/lib/utils/history';

function buildPillarText(pillars: BaziHistoryRecord['pillars'] | undefined): string {
  if (!pillars) return '—';
  return `${pillars.year?.gan}${pillars.year?.zhi} ${pillars.month?.gan}${pillars.month?.zhi} ${pillars.day?.gan}${pillars.day?.zhi} ${pillars.hour?.gan}${pillars.hour?.zhi}`;
}

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function summarizeText(text: string, max = 120): string {
  if (!text) return '暂无摘要';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
}

function getNaYinText(record: BaziHistoryRecord): string | null {
  const yearPillar = record.pillars?.year;
  if (!yearPillar?.gan || !yearPillar?.zhi) return null;
  const naYin = getNaYin(yearPillar.gan, yearPillar.zhi);
  return naYin === '纳音待查' ? null : naYin;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<BaziHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refreshRecords = useCallback(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    refreshRecords();
    setLoading(false);
  }, [refreshRecords]);

  useEffect(() => {
    const handleStorage = () => {
      refreshRecords();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshRecords]);

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteRecord(pendingDeleteId);
    refreshRecords();
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-brand-bg px-4 py-10 text-brand-ink">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl text-brand-ink">测算历史</h1>
          <p className="mt-4 text-sm text-brand-gray">正在加载历史记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-brand-bg px-4 py-10 text-brand-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-brand-ink">测算历史</h1>
          <p className="mt-2 text-sm text-brand-gray">你的八字测算结果会自动保存在本地</p>
        </div>

        {records.length === 0 ? (
          <Card variant="flat" hover={false} className="p-10 text-center">
            <History className="mx-auto mb-4 h-14 w-14 text-brand-light" />
            <p className="text-lg font-medium text-brand-ink">还没有测算记录</p>
            <p className="mt-2 text-sm text-brand-gray">完成八字测算后，结果会自动保存在这里</p>
            <Link href="/bazi" className="mt-6 inline-flex">
              <Button className="px-8">开始测算</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map(record => {
              const naYin = getNaYinText(record);
              return (
                <Card key={record.id} variant="flat" hover={false} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-brand-gray">{formatCreatedAt(record.createdAt)}</p>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-gray transition-colors hover:bg-brand-border-light hover:text-red-500"
                      onClick={() => setPendingDeleteId(record.id)}
                      aria-label="删除记录"
                      title="删除记录"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-4 text-2xl font-semibold tracking-[0.08em] text-brand-ink">
                    {buildPillarText(record.pillars)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-gray">
                    <span>日主：{record.dayMaster || '—'}</span>
                    <span>生肖：{record.zodiac || '—'}</span>
                    {naYin ? <span>纳音：{naYin}</span> : null}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-brand-ink/78">
                    {summarizeText(record.aiSummary, 120)}
                  </p>

                  <div className="mt-6">
                    <Link href={`/bazi?record=${record.id}`} className="inline-flex">
                      <Button className="px-6">查看详情</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="删除记录"
        message="确定要删除这条测算记录吗？此操作无法撤销。"
        confirmText="删除"
        danger
      />
    </div>
  );
}

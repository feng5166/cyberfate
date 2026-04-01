'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Calendar, Trash2, RefreshCw } from 'lucide-react';

interface BaziRecord {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  birthHour: string;
  birthCity: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<BaziRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      // TODO: 从 API 加载历史记录
      // fetch('/api/bazi/history')
      //   .then(res => res.json())
      //   .then(data => setRecords(data.records))
      //   .finally(() => setLoading(false));
      
      // 暂时用占位数据
      setRecords([]);
      setLoading(false);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    // TODO: 调用删除 API
    // await fetch(`/api/bazi/history/${id}`, { method: 'DELETE' });
    setRecords(records.filter(r => r.id !== id));
  };

  const handleReanalyze = (record: BaziRecord) => {
    // 跳转到八字分析页面，并填充数据
    const params = new URLSearchParams({
      name: record.name,
      gender: record.gender,
      birthDate: record.birthDate,
      birthHour: record.birthHour,
      birthCity: record.birthCity || '',
    });
    window.location.href = `/bazi?${params.toString()}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background-alt py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-secondary">加载中...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background-alt py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-secondary mb-4">请先登录查看历史记录</p>
              <Link href="/auth/login?redirect=/history">
                <Button>登录</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">
            📝 历史记录
          </h1>
          <p className="text-secondary">
            查看你的八字分析历史记录，一键重新分析
          </p>
        </div>

        {records.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted" />
              <p className="text-secondary mb-4">暂无历史记录</p>
              <Link href="/bazi">
                <Button>开始测算</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-primary">
                        {record.name || '匿名'}
                      </h3>
                      <span className="text-sm text-muted">
                        {record.gender === 'male' ? '👨 男' : record.gender === 'female' ? '👩 女' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-secondary space-y-1">
                      <p>出生日期：{record.birthDate}</p>
                      <p>出生时辰：{record.birthHour}</p>
                      {record.birthCity && <p>出生地点：{record.birthCity}</p>}
                      <p className="text-xs text-muted">
                        计算时间：{new Date(record.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReanalyze(record)}
                      className="p-2 rounded hover:bg-gray-100 transition-colors"
                      title="重新分析"
                    >
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 rounded hover:bg-red-50 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 说明 */}
        <Card className="mt-6">
          <h3 className="font-heading text-lg font-semibold text-primary mb-4">
            💡 历史记录说明
          </h3>
          <ul className="space-y-2 text-sm text-secondary">
            <li>• 历史记录仅保存出生信息，不保存分析结果</li>
            <li>• 点击"重新分析"可使用相同信息再次测算</li>
            <li>• 删除记录后无法恢复，请谨慎操作</li>
            <li>• 未登录用户的记录保存在本地浏览器，清除缓存后会丢失</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

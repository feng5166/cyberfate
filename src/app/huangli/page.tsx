'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar } from 'lucide-react';

export default function HuangliPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadDate(today);
  }, []);

  const loadDate = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/huangli?date=${date}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    loadDate(date);
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-8 h-8" />
            <h1 className="font-heading text-3xl font-bold text-primary">AI 黄历</h1>
          </div>
          <p className="text-secondary">查看每日宜忌，把握吉时</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-secondary">选择日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 rounded bg-white border border-border text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </Card>

        {loading && (
          <Card>
            <div className="text-center py-8">
              <div className="inline-block animate-spin text-4xl mb-4">📅</div>
              <p className="text-primary">加载中...</p>
            </div>
          </Card>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-primary mb-4">日期信息</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted">公历：</span>{data.solar}</p>
                <p><span className="text-muted">农历：</span>{data.lunar}</p>
                <p><span className="text-muted">干支：</span>{data.ganzhi}</p>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-primary mb-4">宜忌事项</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-2">宜</p>
                  <div className="space-y-1">
                    {data.yi.map((item: string, i: number) => (
                      <p key={i} className="text-sm text-secondary">{item}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium mb-2">忌</p>
                  <div className="space-y-1">
                    {data.ji.map((item: string, i: number) => (
                      <p key={i} className="text-sm text-secondary">{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {session && data.personalAdvice && (
              <Card>
                <h3 className="font-semibold text-primary mb-3">🔮 个性化建议</h3>
                <p className="text-secondary leading-relaxed">{data.personalAdvice}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

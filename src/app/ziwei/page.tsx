'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Sparkles } from 'lucide-react';

const shichenOptions = [
  { value: '', label: '请选择时辰' },
  { value: '0', label: '子时 (23:00-00:59)' },
  { value: '1', label: '丑时 (01:00-02:59)' },
  { value: '2', label: '寅时 (03:00-04:59)' },
  { value: '3', label: '卯时 (05:00-06:59)' },
  { value: '4', label: '辰时 (07:00-08:59)' },
  { value: '5', label: '巳时 (09:00-10:59)' },
  { value: '6', label: '午时 (11:00-12:59)' },
  { value: '7', label: '未时 (13:00-14:59)' },
  { value: '8', label: '申时 (15:00-16:59)' },
  { value: '9', label: '酉时 (17:00-18:59)' },
  { value: '10', label: '戌时 (19:00-20:59)' },
  { value: '11', label: '亥时 (21:00-22:59)' },
];

const genderOptions = [
  { value: '', label: '请选择性别' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

export default function ZiweiPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.birthDate || !formData.birthHour || !formData.gender) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '请求失败');
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="font-heading text-3xl font-bold text-primary">紫微斗数</h1>
          </div>
          <p className="text-secondary">排盘解读，洞察命运</p>
        </div>

        {!result && (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    姓名 <span className="text-muted text-xs">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入您的姓名"
                    className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                
                <Select
                  label="性别"
                  options={genderOptions}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                />
                
                <DatePicker
                  label="出生日期"
                  value={formData.birthDate}
                  onChange={(value) => setFormData({ ...formData, birthDate: value })}
                />
                
                <Select
                  label="出生时辰"
                  options={shichenOptions}
                  value={formData.birthHour}
                  onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? '正在排盘...' : '开始排盘'}
              </Button>
            </form>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            {/* 命盘 */}
            <Card>
              <h3 className="font-semibold text-primary mb-4">命盘</h3>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {result.chart.map((palace: any, idx: number) => (
                  <div key={idx} className="border border-border rounded p-2">
                    <div className="font-semibold text-primary mb-1">{palace.name}</div>
                    <div className="text-muted">{palace.stars.join(' ')}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI 解读 */}
            <Card>
              <h3 className="font-semibold text-primary mb-3">🔮 命盘解读</h3>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
            </Card>

            <Button onClick={() => setResult(null)} variant="secondary" className="w-full">
              重新排盘
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

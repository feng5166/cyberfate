'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingChart } from '@/components/bazi/WuxingChart';

// 十二时辰选项
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
  { value: '-1', label: '不知道（默认午时）' },
];

const genderOptions = [
  { value: '', label: '请选择性别' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

interface BaziResult {
  pillars: {
    year: { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string };
    month: { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string };
    day: { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string };
    hour: { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string };
  };
  wuxing: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  aiAnalysis: string;
}

export default function BaziPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // 验证
    if (!formData.birthDate) {
      setError('请选择出生日期');
      return;
    }
    if (!formData.birthHour) {
      setError('请选择出生时辰');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主',
          gender: formData.gender || 'unknown',
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour),
        }),
      });

      if (!response.ok) {
        throw new Error('计算失败，请稍后重试');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cyber py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-cyber-gold mb-2">
            🔮 八字算命
          </h1>
          <p className="text-text-secondary">
            输入出生信息，AI 为你解读命理
          </p>
        </div>

        {/* 输入表单 */}
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="姓名（选填）"
                placeholder="输入您的姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Select
                label="性别（选填）"
                options={genderOptions}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="出生日期"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
              <Select
                label="出生时辰"
                options={shichenOptions}
                value={formData.birthHour}
                onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? '正在计算...' : '开始测算'}
            </Button>
          </form>
        </Card>

        {/* 结果展示 */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* 四柱命盘 */}
            <BaziChart pillars={result.pillars} />

            {/* 五行分布 */}
            <WuxingChart wuxing={result.wuxing} />

            {/* AI 解读 */}
            <Card>
              <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
                🤖 AI 命理解读
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {result.aiAnalysis}
                </div>
              </div>
            </Card>

            {/* 免责声明 */}
            <div className="text-center text-xs text-text-muted p-4 bg-cyber-card/50 rounded-lg">
              ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。
              命运掌握在自己手中，请理性对待。
            </div>
          </div>
        )}

        {/* 使用说明 */}
        {!result && (
          <Card variant="glass" className="mt-8">
            <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
              📖 使用说明
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• 请输入公历（阳历）出生日期</li>
              <li>• 时辰越准确，分析结果越精确</li>
              <li>• 如不知道时辰，系统将使用午时（12:00）进行计算</li>
              <li>• 姓名和性别为选填项，用于个性化解读</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

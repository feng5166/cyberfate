'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Heart } from 'lucide-react';

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

export default function MarriagePage() {
  const [formData, setFormData] = useState({
    maleName: '',
    maleBirthDate: '',
    maleBirthHour: '-1',
    femaleName: '',
    femaleBirthDate: '',
    femaleBirthHour: '-1',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.maleBirthDate || !formData.femaleBirthDate) {
      setError('请填写双方出生日期');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bazi/marriage', {
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
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="font-heading text-3xl font-bold text-primary">八字合婚</h1>
          </div>
          <p className="text-secondary">测算双方八字匹配度，了解婚姻运势</p>
        </div>

        {/* AI 智能合婚系统说明 */}
        {!result && (
          <div className="space-y-6 mb-8">
            <Card>
              <h3 className="font-heading text-xl font-semibold text-primary mb-4 text-center">
                🔮 AI 智能合婚系统
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-primary">传统命理智慧</p>
                    <p className="text-secondary">基于八字五行、十神、神煞等传统理论</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-primary">AI 深度分析</p>
                    <p className="text-secondary">结合现代 AI 技术，多维度智能解读</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-primary">全面匹配度评估</p>
                    <p className="text-secondary">性格、感情、事业、子女运势综合分析</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-primary">针对性建议</p>
                    <p className="text-secondary">提供改善关系、化解矛盾的实用指导</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-heading text-xl font-semibold text-primary mb-4 text-center">
                📊 合婚分析维度
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-background-alt rounded">
                  <p className="font-semibold text-primary mb-1">💑 性格契合度</p>
                  <p className="text-secondary">分析双方性格特质、相处模式、互补性</p>
                </div>
                <div className="p-3 bg-background-alt rounded">
                  <p className="font-semibold text-primary mb-1">❤️ 感情发展</p>
                  <p className="text-secondary">预测感情走向、关键时间节点、感情稳定性</p>
                </div>
                <div className="p-3 bg-background-alt rounded">
                  <p className="font-semibold text-primary mb-1">💼 事业财运</p>
                  <p className="text-secondary">双方事业配合、财运互助、共同发展潜力</p>
                </div>
                <div className="p-3 bg-background-alt rounded">
                  <p className="font-semibold text-primary mb-1">👶 子女运势</p>
                  <p className="text-secondary">子女缘分、教育观念、家庭和谐度</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-heading text-xl font-semibold text-primary mb-4 text-center">
                📝 分析流程
              </h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-2 font-bold">
                    1
                  </div>
                  <p className="font-semibold text-primary">填写双方信息</p>
                  <p className="text-secondary text-xs mt-1">姓名、出生日期、时辰</p>
                </div>
                <div className="hidden md:block text-muted">→</div>
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-2 font-bold">
                    2
                  </div>
                  <p className="font-semibold text-primary">排盘计算</p>
                  <p className="text-secondary text-xs mt-1">生成双方八字命盘</p>
                </div>
                <div className="hidden md:block text-muted">→</div>
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-2 font-bold">
                    3
                  </div>
                  <p className="font-semibold text-primary">AI 智能分析</p>
                  <p className="text-secondary text-xs mt-1">多维度深度解读</p>
                </div>
                <div className="hidden md:block text-muted">→</div>
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-2 font-bold">
                    4
                  </div>
                  <p className="font-semibold text-primary">获取报告</p>
                  <p className="text-secondary text-xs mt-1">查看详细合婚分析</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!result && (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 男方信息 */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">👨 男方信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      姓名 <span className="text-muted text-xs">（选填）</span>
                    </label>
                    <input
                      type="text"
                      value={formData.maleName}
                      onChange={(e) => setFormData({ ...formData, maleName: e.target.value })}
                      placeholder="男方姓名"
                      className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div />
                  <DatePicker
                    label="出生日期"
                    value={formData.maleBirthDate}
                    onChange={(value) => setFormData({ ...formData, maleBirthDate: value })}
                  />
                  <Select
                    label="出生时辰"
                    options={shichenOptions}
                    value={formData.maleBirthHour}
                    onChange={(e) => setFormData({ ...formData, maleBirthHour: e.target.value })}
                  />
                </div>
              </div>

              {/* 女方信息 */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">👩 女方信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      姓名 <span className="text-muted text-xs">（选填）</span>
                    </label>
                    <input
                      type="text"
                      value={formData.femaleName}
                      onChange={(e) => setFormData({ ...formData, femaleName: e.target.value })}
                      placeholder="女方姓名"
                      className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div />
                  <DatePicker
                    label="出生日期"
                    value={formData.femaleBirthDate}
                    onChange={(value) => setFormData({ ...formData, femaleBirthDate: value })}
                  />
                  <Select
                    label="出生时辰"
                    options={shichenOptions}
                    value={formData.femaleBirthHour}
                    onChange={(e) => setFormData({ ...formData, femaleBirthHour: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? '正在分析...' : '开始合婚测算'}
              </Button>
            </form>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            {/* 匹配度总评 */}
            <Card>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary mb-4">综合匹配度</h3>
                <div className="text-5xl mb-2">{result.score}</div>
                <div className="text-2xl mb-4">{result.hearts}</div>
                <p className="text-secondary">{result.level}</p>
              </div>
            </Card>

            {/* 双方八字 */}
            <Card>
              <h3 className="font-semibold text-primary mb-4">双方八字</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted mb-1">男方八字</p>
                  <p className="text-primary font-mono">{result.maleBazi}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">女方八字</p>
                  <p className="text-primary font-mono">{result.femaleBazi}</p>
                </div>
              </div>
            </Card>

            {/* AI 分析 */}
            <Card>
              <h3 className="font-semibold text-primary mb-3">💕 AI 合婚分析</h3>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
            </Card>

            <Button onClick={() => setResult(null)} variant="secondary" className="w-full">
              重新测算
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

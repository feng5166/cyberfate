'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { saveBirthInfo, loadBirthInfo, clearBirthInfo } from '@/lib/utils/storage';

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

interface DailyResult {
  date: string;
  lunarDate: string;
  dayGanzhi: string;
  overall: number;
  ratings: {
    career: number;
    wealth: number;
    love: number;
    health: number;
  };
  suitable: string[];
  avoid: string[];
  lucky: {
    color: string;
    numbers: number[];
    direction: string;
  };
  advice: string;
}

// 星级显示组件
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-cyber-gold' : 'text-text-muted'}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function DailyPage() {
  const [formData, setFormData] = useState({
    birthDate: '',
    birthHour: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DailyResult | null>(null);
  const [today, setToday] = useState('');
  const [hasSavedData, setHasSavedData] = useState(false);
  const autoSubmittedRef = useRef(false);

  const fetchFortune = async (birthDate: string, birthHour: string, targetDate: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          birthHour: parseInt(birthHour),
          targetDate,
        }),
      });
      if (!response.ok) throw new Error('获取运势失败，请稍后重试');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setToday(dateStr);

    const saved = loadBirthInfo();
    if (saved?.birthDate && saved?.birthHour) {
      setFormData({ birthDate: saved.birthDate, birthHour: saved.birthHour });
      setHasSavedData(true);
      // 有保存数据时自动获取运势
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        fetchFortune(saved.birthDate, saved.birthHour, dateStr);
      }
    }
  }, []);

  const clearSavedData = () => {
    clearBirthInfo();
    setFormData({ birthDate: '', birthHour: '' });
    setHasSavedData(false);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

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
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: formData.birthDate,
          birthHour: parseInt(formData.birthHour),
          targetDate: today,
        }),
      });

      if (!response.ok) {
        throw new Error('获取运势失败，请稍后重试');
      }

      const data = await response.json();
      setResult(data);
      // 保存到 localStorage
      saveBirthInfo(formData);
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
            📅 每日运势
          </h1>
          <p className="text-text-secondary">
            基于八字的个性化每日运势分析
          </p>
          {today && (
            <p className="text-cyber-gold mt-2">
              {today}
            </p>
          )}
        </div>

        {/* 输入表单 */}
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-text-muted text-sm">
                {hasSavedData ? '已记住您的出生信息' : '输入您的出生信息，获取专属今日运势'}
              </p>
              {hasSavedData && (
                <button
                  type="button"
                  onClick={clearSavedData}
                  className="text-xs text-text-muted hover:text-cyber-gold transition-colors"
                >
                  重新输入
                </button>
              )}
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
              {loading ? '正在分析...' : '查看今日运势'}
            </Button>
          </form>
        </Card>

        {/* 结果展示 */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* 日期信息 */}
            <Card variant="highlight">
              <div className="text-center">
                <div className="text-2xl font-heading text-cyber-gold mb-2">
                  {result.date}
                </div>
                <div className="text-text-secondary">
                  农历 {result.lunarDate} · {result.dayGanzhi}日
                </div>
              </div>
            </Card>

            {/* 综合运势 */}
            <Card>
              <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
                🌟 综合运势
              </h3>
              <div className="flex items-center justify-center gap-4">
                <StarRating rating={result.overall} />
                <span className="text-2xl font-bold text-cyber-gold">
                  {result.overall}/5
                </span>
              </div>
            </Card>

            {/* 各方面运势 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="text-center">
                <div className="text-2xl mb-2">💼</div>
                <div className="text-sm text-text-muted mb-1">事业</div>
                <StarRating rating={result.ratings.career} />
              </Card>
              <Card className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-text-muted mb-1">财运</div>
                <StarRating rating={result.ratings.wealth} />
              </Card>
              <Card className="text-center">
                <div className="text-2xl mb-2">❤️</div>
                <div className="text-sm text-text-muted mb-1">感情</div>
                <StarRating rating={result.ratings.love} />
              </Card>
              <Card className="text-center">
                <div className="text-2xl mb-2">🏥</div>
                <div className="text-sm text-text-muted mb-1">健康</div>
                <StarRating rating={result.ratings.health} />
              </Card>
            </div>

            {/* 宜忌 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-heading text-lg font-semibold text-green-400 mb-3">
                  ✅ 宜
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.suitable.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="font-heading text-lg font-semibold text-red-400 mb-3">
                  ❌ 忌
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.avoid.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm text-red-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            {/* 幸运信息 */}
            <Card>
              <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
                🍀 今日幸运
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-text-muted text-sm mb-1">幸运色</div>
                  <div className="text-lg font-semibold text-text-primary">
                    {result.lucky.color}
                  </div>
                </div>
                <div>
                  <div className="text-text-muted text-sm mb-1">幸运数字</div>
                  <div className="text-lg font-semibold text-text-primary">
                    {result.lucky.numbers.join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-text-muted text-sm mb-1">幸运方位</div>
                  <div className="text-lg font-semibold text-text-primary">
                    {result.lucky.direction}
                  </div>
                </div>
              </div>
            </Card>

            {/* 建议 */}
            <Card>
              <h3 className="font-heading text-lg font-semibold text-cyber-gold mb-4">
                💡 今日建议
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {result.advice}
              </p>
            </Card>

            {/* 免责声明 */}
            <div className="text-center text-xs text-text-muted p-4 bg-cyber-card/50 rounded-lg">
              ⚠️ 免责声明：运势分析仅供娱乐参考，不构成任何决策建议。
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
              <li>• 每日运势基于您的八字日主与当日干支的关系分析</li>
              <li>• 需要输入出生日期和时辰，以计算您的日主</li>
              <li>• 运势每日更新，建议每天早上查看</li>
              <li>• 仅供参考，请以实际情况为准</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

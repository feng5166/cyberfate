'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { saveBirthInfo, loadBirthInfo } from '@/lib/utils/storage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingChart } from '@/components/bazi/WuxingChart';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { Tag } from '@/components/ui/Tag';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
  });
  const [loading, setLoading] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  useEffect(() => {
    async function loadUserBirthInfo() {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/birth-info');
          if (res.ok) {
            const { data } = await res.json();
            if (data?.birthDate) {
              setFormData(prev => ({
                ...prev,
                name: data.nickname || '',
                birthDate: data.birthDate || '',
                birthHour: data.birthHour || '-1',
                gender: data.gender || '',
              }));
              return;
            }
          }
        } catch (e) {
          console.error('Failed to load birth info:', e);
        }
      }
      const saved = loadBirthInfo();
      if (saved) {
        setFormData(prev => ({
          ...prev,
          birthDate: saved.birthDate || '',
          birthHour: saved.birthHour || '-1',
          gender: saved.gender || '',
        }));
      }
    }
    if (status !== 'loading') loadUserBirthInfo();
  }, [status]);

  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!formData.birthDate) { setError('请选择出生日期'); return; }
    if (!formData.birthHour) { setError('请选择出生时辰'); return; }

    setLoading(true);
    saveBirthInfo({ birthDate: formData.birthDate, birthHour: formData.birthHour, gender: formData.gender });

    if (status === 'authenticated') {
      try {
        await fetch('/api/user/birth-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, birthDate: formData.birthDate, birthHour: formData.birthHour, gender: formData.gender }),
        });
      } catch (e) { console.error('Failed to save:', e); }
    }

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '缘主', gender: formData.gender || 'unknown',
          birthDate: formData.birthDate, birthHour: parseInt(formData.birthHour),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { window.location.href = '/auth/login?redirect=/bazi'; return; }
        if (data.error === 'QUOTA_EXCEEDED') { setShowQuotaModal(true); return; }
        throw new Error(data.error || '服务器错误，请稍后重试');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 统一 input 样式
  const inputClass = "w-full h-12 rounded-lg border border-gray-300 px-4 text-sm text-brand-black placeholder:text-brand-light focus:border-brand-black focus:ring-2 focus:ring-brand-black/5 outline-none transition-all";

  return (
    <div className="min-h-screen bg-white">
      {/* 页面标题 */}
      <PageHeader
        title="八字分析"
        subtitle="输入您的出生信息，AI 将为您解读命盘"
      />

      {/* 主体：左右分栏 */}
      <Container>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-20 md:pb-26">
          {/* ===== 左侧：输入表单 ===== */}
          <Card variant="form" hover={false} className="flex-shrink-0 w-full lg:w-auto lg:max-w-[440px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 区块标题 */}
              <h2 className="text-base font-medium text-brand-black mb-2">📋 出生信息</h2>

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                <input
                  type="text" placeholder="输入您的姓名" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* 性别 - 用 SegmentControl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
                <SegmentControl
                  options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]}
                  value={formData.gender}
                  onChange={(v) => setFormData({ ...formData, gender: v })}
                />
              </div>

              {/* 出生日期 */}
              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
              />

              {/* 出生时辰 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">出生时辰</label>
                <Select
                  options={shichenOptions}
                  value={formData.birthHour}
                  onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <Button type="submit" variant="primary" loading={loading} className="w-full h-[50px] text-base font-medium mt-2">
                {loading ? '正在计算...' : '开始分析'}
              </Button>
            </form>
          </Card>

          {/* ===== 右侧：结果展示区 ===== */}
          <div className="flex-1 min-w-0">
            {/* 加载中 */}
            {loading && (
              <Card hover={false} className="flex flex-col items-center justify-center py-16">
                <BaguaSpinner size={64} />
                <p className="mt-4 text-brand-black font-medium">正在计算您的命盘...</p>
                <p className="text-sm text-brand-light mt-2">AI 正在解读中，请稍候</p>
              </Card>
            )}

            {/* 空状态（未分析时）*/}
            {!result && !loading && (
              <Card hover={false} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-brand-light" />
                </div>
                <p className="text-brand-black font-medium text-lg">填写信息后点击开始分析</p>
                <p className="text-sm text-brand-light mt-2">AI 将为您生成专属命盘解读</p>
              </Card>
            )}

            {/* 分析结果 */}
            {result && !loading && (
              <div className="space-y-8 animate-fadeIn">
                {/* 四柱命盘 */}
                <BaziChart pillars={result.pillars} />

                {/* 五行分布 */}
                <WuxingChart wuxing={result.wuxing} />

                {/* AI 解读 */}
                <Card hover={false}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">
                      🤖 AI 分析·解读
                    </span>
                  </div>
                  <div className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {result.aiAnalysis}
                  </div>
                </Card>

                {/* 引导到每日运势 */}
                <Card hover={false} className="text-center py-6">
                  <p className="text-brand-gray mb-3 text-sm">想了解今天的运势？</p>
                  <Link href="/daily">
                    <Button variant="secondary" size="sm">
                      📅 查看每日运势
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </Card>

                {/* 免责声明 */}
                <div className="text-center text-xs text-brand-light p-3 bg-brand-bg rounded-lg">
                  ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。命运掌握在自己手中，请理性对待。
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* 版本标记 */}
      <div className="hidden" data-version="20260402-v2"></div>
    </div>
  );
}

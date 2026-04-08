'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

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

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-[#1C1A16]/15 bg-white text-[#1C1A16] placeholder:text-[#1C1A16]/25 focus:outline-none focus:border-[#1C1A16]/30 transition-colors';

const selectClass =
  'w-full h-12 px-4 rounded-xl border border-[#1C1A16]/15 bg-white text-[#1C1A16] focus:outline-none focus:border-[#1C1A16]/30 transition-colors appearance-none cursor-pointer';

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

    if (!formData.gender) {
      setError('请选择性别');
      return;
    }
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
      const res = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* 标题区 */}
      <div className="text-center pt-10 md:pt-14 pb-8">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <Sparkles className="w-7 h-7 text-[#1C1A16]/70" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1C1A16]">
            紫微斗数
          </h1>
        </div>
        <p className="text-sm text-[#1C1A16]/55">
          排盘解读，洞察命运密码
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20">
        {/* 表单区 */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#1C1A16]/8 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 姓名 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1C1A16]">
                    姓名 <span className="text-[#1C1A16]/25 text-xs">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入您的姓名"
                    className={inputClass}
                  />
                </div>

                {/* 性别 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1C1A16]">
                    性别
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={selectClass}
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 出生日期 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1C1A16]">
                    出生日期
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* 出生时辰 */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1C1A16]">
                    出生时辰
                  </label>
                  <select
                    value={formData.birthHour}
                    onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                    className={selectClass}
                  >
                    {shichenOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C1A16] text-white rounded-lg px-8 py-3 font-medium hover:bg-[#2C2924] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '正在排盘...' : '开始排盘'}
              </button>
            </form>
          </div>
        )}

        {/* 结果区 */}
        {result && (
          <div className="space-y-6">
            {/* 命盘卡片 */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#1C1A16]/8 p-6 sm:p-8">
              <h3 className="font-display text-xl font-semibold text-[#1C1A16] mb-5">
                命盘
              </h3>
              <div className="grid grid-cols-4 gap-px bg-[#1C1A16]/8 rounded-xl overflow-hidden">
                {result.chart.map((palace: any, idx: number) => (
                  <div key={idx} className="bg-white p-3">
                    <div className="font-medium text-sm text-[#1C1A16] mb-1">
                      {palace.name}
                    </div>
                    <div className="text-xs text-[#1C1A16]/55 leading-relaxed">
                      {palace.stars.join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 解读卡片 */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#1C1A16]/8 p-6 sm:p-8">
              <h3 className="font-display text-xl font-semibold text-[#1C1A16] mb-4">
                🔮 命盘解读
              </h3>
              <p className="text-sm text-[#1C1A16]/80 leading-relaxed whitespace-pre-wrap">
                {result.analysis}
              </p>
            </div>

            {/* 重新排盘按钮 */}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full rounded-lg px-8 py-3 font-medium border border-[#1C1A16]/20 text-[#1C1A16] bg-transparent hover:bg-[#1C1A16]/5 transition-colors"
            >
              重新排盘
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Heart, HeartPulse } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';

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

  const inputClass =
    'w-full rounded-xl border border-[#1C1A16]/15 bg-white px-4 py-3 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <div className="flex-1 pb-20">
        <div className="pt-12 pb-10 text-center px-4">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#1C1A16]/10 bg-white/80 text-sm text-[#1C1A16]/70">
            <HeartPulse className="w-4 h-4 text-[#B7152A]" />
            <span>AI 八字合婚</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-[40px] font-semibold text-[#1C1A16] tracking-wide">八字合婚分析</h1>
          <p className="mt-3 text-base text-[#1C1A16]/70">
            输入双方出生信息，了解缘分契合度与婚姻走势
          </p>
        </div>

        <Container>
          <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0">
            {!result && (
              <>
                <Card
                  hover={false}
                  className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none px-6 py-8 sm:px-8"
                >
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-2xl">
                          👨
                        </div>
                        <div>
                          <p className="text-sm text-[#1C1A16]/70">男方信息</p>
                          <h3 className="text-lg font-semibold text-[#1C1A16]">男方出生资料</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-sm font-medium text-[#1C1A16]">
                            姓名 <span className="text-xs text-[#1C1A16]/40">（选填）</span>
                          </label>
                          <input
                            type="text"
                            value={formData.maleName}
                            onChange={(e) => setFormData({ ...formData, maleName: e.target.value })}
                            placeholder="请输入男方姓名"
                            className={inputClass}
                          />
                        </div>
                        <DatePicker
                          label="出生日期"
                          value={formData.maleBirthDate}
                          onChange={(value) => setFormData({ ...formData, maleBirthDate: value })}
                          className="space-y-2 sm:col-span-1"
                          triggerClassName="h-12"
                        />
                        <div className="sm:col-span-1">
                          <Select
                            label="出生时辰"
                            options={shichenOptions}
                            value={formData.maleBirthHour}
                            onChange={(e) => setFormData({ ...formData, maleBirthHour: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-2xl">
                          👩
                        </div>
                        <div>
                          <p className="text-sm text-[#1C1A16]/70">女方信息</p>
                          <h3 className="text-lg font-semibold text-[#1C1A16]">女方出生资料</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-sm font-medium text-[#1C1A16]">
                            姓名 <span className="text-xs text-[#1C1A16]/40">（选填）</span>
                          </label>
                          <input
                            type="text"
                            value={formData.femaleName}
                            onChange={(e) => setFormData({ ...formData, femaleName: e.target.value })}
                            placeholder="请输入女方姓名"
                            className={inputClass}
                          />
                        </div>
                        <DatePicker
                          label="出生日期"
                          value={formData.femaleBirthDate}
                          onChange={(value) => setFormData({ ...formData, femaleBirthDate: value })}
                          className="space-y-2 sm:col-span-1"
                          triggerClassName="h-12"
                        />
                        <div className="sm:col-span-1">
                          <Select
                            label="出生时辰"
                            options={shichenOptions}
                            value={formData.femaleBirthHour}
                            onChange={(e) => setFormData({ ...formData, femaleBirthHour: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {error && (
                      <div className="rounded-xl border border-[#E5484D]/30 bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" loading={loading}>
                      {loading ? '正在分析…' : '开始合婚测算'}
                    </Button>
                  </form>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6">
                    <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-4">🔮 AI 智能合婚系统</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-semibold text-[#1C1A16]">传统命理智慧</p>
                        <p className="text-[#1C1A16]/70">结合八字、五行、十神、神煞等多重信息</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">AI 深度分析</p>
                        <p className="text-[#1C1A16]/70">以语言模型多角度评估双方互动与成长空间</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">匹配度评级</p>
                        <p className="text-[#1C1A16]/70">输出感情、事业、家庭等维度等级</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1A16]">改善建议</p>
                        <p className="text-[#1C1A16]/70">提供沟通、造势与化解策略</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1C1A16]/10 bg-white p-6">
                    <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-4">📊 合婚分析维度</h3>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-3">
                        <p className="font-semibold text-[#1C1A16]">性格契合</p>
                        <p className="text-[#1C1A16]/70">洞察性格、节奏、沟通模式是否互补</p>
                      </div>
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-3">
                        <p className="font-semibold text-[#1C1A16]">感情发展</p>
                        <p className="text-[#1C1A16]/70">推演阶段性节点与稳定度</p>
                      </div>
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-3">
                        <p className="font-semibold text-[#1C1A16]">事业财运</p>
                        <p className="text-[#1C1A16]/70">评估事业协同与财富共振</p>
                      </div>
                      <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-3">
                        <p className="font-semibold text-[#1C1A16]">子女与家庭</p>
                        <p className="text-[#1C1A16]/70">观照子女缘分与家庭气场</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card
                  hover={false}
                  className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6"
                >
                  <h3 className="text-lg font-semibold text-[#1C1A16] text-center mb-6">📝 分析流程</h3>
                  <div className="flex flex-col md:flex-row items-stretch gap-4 text-sm text-[#1C1A16]/70">
                    {[{
                      title: '填写出生信息',
                      desc: '录入双方姓名、出生日期、时辰',
                    }, {
                      title: '排盘生成',
                      desc: '系统自动计算双方八字命盘',
                    }, {
                      title: 'AI 深入解读',
                      desc: '多维度智能匹配与风险提示',
                    }, {
                      title: '获取完整报告',
                      desc: '查看匹配度、八字与建议',
                    }].map((step, index) => (
                      <div key={step.title} className="flex flex-1 flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#1C1A16] text-white flex items-center justify-center mb-3 text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-base text-[#1C1A16] font-medium">{step.title}</p>
                        <p className="mt-1 text-xs text-[#1C1A16]/70">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {result && (
              <div className="space-y-6">
                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1C1A16]/10 bg-[#FAF9F6] text-sm text-[#1C1A16]/70">
                      <HeartPulse className="w-4 h-4 text-[#B7152A]" />
                      <span>综合匹配度</span>
                    </div>
                    <div className="text-5xl font-semibold text-[#1C1A16]">{result.score}</div>
                    <div className="flex items-center gap-2 text-[#B7152A]">
                      <Heart className="w-6 h-6" fill="#B7152A" stroke="#B7152A" />
                      <span className="text-2xl font-semibold">{result.hearts}</span>
                    </div>
                    <p className="text-sm text-[#1C1A16]/70">{result.level}</p>
                  </div>
                </Card>

                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <h3 className="text-lg font-semibold text-[#1C1A16] mb-4">双方八字命盘</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4">
                      <p className="text-sm text-[#1C1A16]/70 mb-2">男方八字</p>
                      <p className="font-mono text-lg text-[#1C1A16] whitespace-pre-wrap">{result.maleBazi}</p>
                    </div>
                    <div className="rounded-2xl border border-[#1C1A16]/10 bg-[#FAF9F6] p-4">
                      <p className="text-sm text-[#1C1A16]/70 mb-2">女方八字</p>
                      <p className="font-mono text-lg text-[#1C1A16] whitespace-pre-wrap">{result.femaleBazi}</p>
                    </div>
                  </div>
                </Card>

                <Card hover={false} className="rounded-2xl border border-[#1C1A16]/10 bg-white shadow-none p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HeartPulse className="w-5 h-5 text-[#B7152A]" />
                    <h3 className="text-lg font-semibold text-[#1C1A16]">AI 合婚分析</h3>
                  </div>
                  <p className="text-sm leading-7 text-[#1C1A16]/80 whitespace-pre-wrap">
                    {result.analysis}
                  </p>
                </Card>

                <Button onClick={() => setResult(null)} variant="secondary" className="w-full">
                  重新测算
                </Button>
              </div>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}

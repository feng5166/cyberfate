'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { saveBirthInfo, loadBirthInfo } from '@/lib/utils/storage';

// export const metadata = { title: '八字分析' }; // 客户端组件不能导出 metadata
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BaguaSpinner } from '@/components/ui/BaguaSpinner';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingChart } from '@/components/bazi/WuxingChart';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';
import { Sparkles } from 'lucide-react';
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
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthHour: '-1',
  });
  const [loading, setLoading] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // 从数据库或 localStorage 恢复已保存的信息
  useEffect(() => {
    async function loadUserBirthInfo() {
      // 登录用户：优先从数据库读取
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
          console.error('Failed to load birth info from server:', e);
        }
      }
      // 未登录或数据库没有：从 localStorage 读取
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
    if (status !== 'loading') {
      loadUserBirthInfo();
    }
  }, [status]);
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

    // 保存到 localStorage
    saveBirthInfo({
      birthDate: formData.birthDate,
      birthHour: formData.birthHour,
      gender: formData.gender,
    });

    // 登录用户：同时保存到数据库
    if (status === 'authenticated') {
      try {
        await fetch('/api/user/birth-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            birthDate: formData.birthDate,
            birthHour: formData.birthHour,
            gender: formData.gender,
          }),
        });
      } catch (e) {
        console.error('Failed to save birth info to server:', e);
      }
    }

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

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth/login?redirect=/bazi';
          return;
        }
        if (data.error === 'QUOTA_EXCEEDED') {
          setShowQuotaModal(true);
          return;
        }
        throw new Error(data.error || '服务器错误，请稍后重试');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      {showQuotaModal && <QuotaLimitModal onClose={() => setShowQuotaModal(false)} />}
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
              八字分析
            </h1>
          </div>
          <p className="text-secondary">
            输入出生信息，AI 为你解读命理
          </p>
        </div>

        {/* 输入表单 */}
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">
                  姓名 <span className="text-muted text-xs">（选填）</span>
                </label>
                <input
                  type="text"
                  placeholder="输入您的姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">
                  性别 <span className="text-red-400 text-xs">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded bg-white border border-border text-primary focus:outline-none focus:border-primary transition-colors"
                >
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DatePicker
                label="出生日期"
                value={formData.birthDate}
                onChange={(value) => setFormData({ ...formData, birthDate: value })}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">
                  出生时辰 <span className="text-red-400 text-xs">*</span>
                </label>
                <Select
                  label=""
                  options={shichenOptions}
                  value={formData.birthHour}
                  onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                  required
                />
              </div>
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

        {/* 加载中状态 */}
        {loading && (
          <Card className="mb-8">
            <div className="flex flex-col items-center justify-center py-12">
              <BaguaSpinner size={64} />
              <p className="mt-4 text-primary">正在计算您的命盘...</p>
              <p className="text-sm text-muted mt-2">AI 正在解读中，请稍候</p>
            </div>
          </Card>
        )}

        {/* 结果展示 */}
        {result && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {/* 四柱命盘 */}
            <BaziChart pillars={result.pillars} />

            {/* 五行分布 */}
            <WuxingChart wuxing={result.wuxing} />

            {/* AI 解读 */}
            <Card>
              <h3 className="font-heading text-lg font-semibold text-primary mb-4">
                🤖 AI 命理解读
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-secondary whitespace-pre-wrap leading-relaxed">
                  {result.aiAnalysis}
                </div>
              </div>
            </Card>

            {/* 引导到每日运势 */}
            <Card className="text-center">
              <p className="text-secondary mb-4">想了解今天的运势？</p>
              <Link href="/daily">
                <Button variant="secondary">
                  📅 查看每日运势
                </Button>
              </Link>
            </Card>

            {/* 免责声明 */}
            <div className="text-center text-xs text-muted p-4 bg-cyber-card/50 rounded-lg">
              ⚠️ 免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。
              命运掌握在自己手中，请理性对待。
            </div>
          </div>
        )}

        {/* 使用说明 */}
        {!result && (
          <>
            {/* 产品介绍板块 */}
            <div className="space-y-8 mt-12">
              {/* 板块 1：AI 智能八字解析系统 */}
              <Card>
                <h3 className="font-heading text-xl font-semibold text-primary mb-6 text-center">
                  🤖 AI 智能八字解析系统
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="font-semibold text-primary mb-2">精准命盘</h4>
                    <p className="text-sm text-secondary">真太阳时修正，精确计算四柱八字</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🧠</div>
                    <h4 className="font-semibold text-primary mb-2">AI 解读</h4>
                    <p className="text-sm text-secondary">结合传统命理与现代 AI 技术</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">⚖️</div>
                    <h4 className="font-semibold text-primary mb-2">科学客观</h4>
                    <p className="text-sm text-secondary">理性分析，不夸大不迷信</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="font-semibold text-primary mb-2">全方位分析</h4>
                    <p className="text-sm text-secondary">性格、事业、财运、健康多维度</p>
                  </div>
                </div>
              </Card>

              {/* 板块 2：全方位命理解析 */}
              <Card>
                <h3 className="font-heading text-xl font-semibold text-primary mb-6 text-center">
                  🌟 全方位命理解析
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="text-2xl">💎</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">性格洞察</h4>
                      <p className="text-sm text-secondary">深度解读性格特质、优势与盲区</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">💼</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">事业方向</h4>
                      <p className="text-sm text-secondary">适合的职业领域与发展建议</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">💰</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">财运特征</h4>
                      <p className="text-sm text-secondary">财富倾向与理财策略分析</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">🏥</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">健康运势</h4>
                      <p className="text-sm text-secondary">体质特点与养生保健建议</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 板块 3：使用指南 */}
              <Card>
                <h3 className="font-heading text-xl font-semibold text-primary mb-6 text-center">
                  📖 使用指南
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">填写出生信息</h4>
                      <p className="text-sm text-secondary">输入出生日期、时辰和地点</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">选择性别</h4>
                      <p className="text-sm text-secondary">性别影响命理解读角度</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">确认历法</h4>
                      <p className="text-sm text-secondary">阳历或农历，系统自动转换</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">4</div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">获取分析报告</h4>
                      <p className="text-sm text-secondary">AI 为您生成详细解读</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 板块 4：常见问题 FAQ */}
              <Card>
                <h3 className="font-heading text-xl font-semibold text-primary mb-6 text-center">
                  ❓ 常见问题
                </h3>
                <div className="space-y-4">
                  <details className="group" open>
                    <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors">
                      八字分析准确吗？
                      <span className="text-muted">▼</span>
                    </summary>
                    <p className="text-sm text-secondary mt-2 px-3 pb-3">
                      八字分析基于传统命理学体系，结合 AI 技术提供参考。准确度取决于出生信息的精确程度。建议将其作为了解自己的一种方式，而非绝对预测。
                    </p>
                  </details>
                  <details className="group" open>
                    <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors">
                      不知道准确出生时间怎么办？
                      <span className="text-muted">▼</span>
                    </summary>
                    <p className="text-sm text-secondary mt-2 px-3 pb-3">
                      可以选择"不知道（默认午时）"选项，系统将使用中午时辰进行分析。或者咨询父母、查看出生证明。时辰准确度会影响分析精度。
                    </p>
                  </details>
                  <details className="group" open>
                    <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors">
                      八字和西方星座有什么区别？
                      <span className="text-muted">▼</span>
                    </summary>
                    <p className="text-sm text-secondary mt-2 px-3 pb-3">
                      八字基于出生年月日时的天干地支，考虑五行生克关系；星座基于太阳所在黄道位置，只看出生月份。八字信息更详细，理论体系更复杂。
                    </p>
                  </details>
                  <details className="group" open>
                    <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors">
                      多久查看一次八字分析？
                      <span className="text-muted">▼</span>
                    </summary>
                    <p className="text-sm text-secondary mt-2 px-3 pb-3">
                      八字命盘是固定的，无需频繁查看。建议在人生重要节点（求职、婚恋、创业等）参考，配合每日运势了解短期运程。
                    </p>
                  </details>
                  <details className="group" open>
                    <summary className="cursor-pointer font-semibold text-primary flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors">
                      八字能帮助做重要决定吗？
                      <span className="text-muted">▼</span>
                    </summary>
                    <p className="text-sm text-secondary mt-2 px-3 pb-3">
                      八字分析可以作为参考维度之一，但不应作为唯一决策依据。重要决策需要结合实际情况、专业建议和个人判断综合考虑。
                    </p>
                  </details>
                </div>
              </Card>

              {/* 功能矩阵 */}
              <Card>
                <h3 className="font-heading text-xl font-semibold text-primary mb-6 text-center">
                  🎯 更多命理功能
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="/bazi/marriage" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💑</div>
                    <h4 className="font-semibold text-primary mb-1">八字合婚</h4>
                    <p className="text-xs text-secondary text-center">分析婚配契合度</p>
                  </Link>
                  <Link href="/daily" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
                    <h4 className="font-semibold text-primary mb-1">每日运势</h4>
                    <p className="text-xs text-secondary text-center">查看今天的运程</p>
                  </Link>
                  <Link href="/ziwei" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🌟</div>
                    <h4 className="font-semibold text-primary mb-1">紫微排盘</h4>
                    <p className="text-xs text-secondary text-center">紫微斗数命盘</p>
                  </Link>
                  <Link href="/meihua" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🌸</div>
                    <h4 className="font-semibold text-primary mb-1">梅花易数</h4>
                    <p className="text-xs text-secondary text-center">周易占卜吉凶</p>
                  </Link>
                  <Link href="/tarot" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🃏</div>
                    <h4 className="font-semibold text-primary mb-1">塔罗占卜</h4>
                    <p className="text-xs text-secondary text-center">塔罗牌抽牌解读</p>
                  </Link>
                  <Link href="/huangli" className="flex flex-col items-center p-4 rounded hover:bg-gray-50 transition-colors group">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📜</div>
                    <h4 className="font-semibold text-primary mb-1">AI 黄历</h4>
                    <p className="text-xs text-secondary text-center">每日宜忌查询</p>
                  </Link>
                </div>
              </Card>
            </div>

            {/* 原有的使用说明（保留） */}
            <Card variant="default" className="mt-8">
              <h3 className="font-heading text-lg font-semibold text-primary mb-4">
                📖 使用说明
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                <li>• 请输入公历（阳历）出生日期</li>
                <li>• 时辰越准确，分析结果越精确</li>
                <li>• 如不知道时辰，系统将使用午时（12:00）进行计算</li>
                <li>• 姓名和性别为选填项，用于个性化解读</li>
              </ul>
            </Card>
          </>
        )}
      </div>
      {/* 版本标记 - 强制刷新缓存 */}
      <div className="hidden" data-version="20260310-1242"></div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';

// ── 类型 ───────────────────────────────────────────
interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
}
interface OrderInfo {
  id: string;
  plan: string;
  amount: number;
  status: string;
  payMethod: string | null;
  createdAt: string;
  paidAt: string | null;
}
interface SubInfo {
  id: string;
  plan: string;
  status: string;
  startAt: string;
  expireAt: string;
  createdAt: string;
}

type Tab = 'check' | 'fix-vip' | 'create-sub';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>('check');

  // 未登录
  if (status === 'loading') return <LoadingSpinner />;
  if (!session) return <LoginPrompt />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-amber-400">⚙️ Admin 管理面板</h1>
            <p className="text-xs text-gray-500 mt-0.5">{session.user?.email}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            已认证
          </span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-5xl mx-auto px-4 pt-6 flex gap-2">
        {([
          ['check', '🔍 查询用户'],
          ['fix-vip', '🔧 修正 VIP'],
          ['create-sub', '➕ 创建订阅'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === 'check' && <CheckUserTab />}
        {tab === 'fix-vip' && <FixVipTab />}
        {tab === 'create-sub' && <CreateSubTab />}
      </main>
    </div>
  );
}

// ── Login Prompt ─────────────────────────────────────
function LoginPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 max-w-md">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold mb-2">需要管理员权限</h2>
        <p className="text-gray-400 text-sm mb-6">请使用管理员账号登录后访问此页面</p>
        <button
          onClick={() => signIn()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
        >
          登录
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-gray-400 animate-pulse">加载中...</div>
    </div>
  );
}

// ── Tab 1: 查询用户 ─────────────────────────────────
function CheckUserTab() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ user?: UserInfo; orders?: OrderInfo[]; subs?: SubInfo[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || '查询失败');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <input
          type="email"
          placeholder="输入用户邮箱..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          onClick={handleCheck}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-medium rounded-lg transition-colors"
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-2">👤 用户信息</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-gray-500">ID:</span><br/><code className="text-amber-300 text-xs break-all">{result.user?.id}</code></div>
              <div><span className="text-gray-500">邮箱:</span><br/>{result.user?.email}</div>
              <div><span className="text-gray-500">注册时间:</span><br/>{result.user?.createdAt ? new Date(result.user.createdAt).toLocaleString('zh-CN') : '-'}</div>
            </div>
          </div>

          {/* Subscriptions */}
          {result.subs && result.subs.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-2">💳 订阅记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-white/5">
                      <th className="pb-2 pr-4">套餐</th>
                      <th className="pb-2 pr-4">状态</th>
                      <th className="pb-2 pr-4">开始</th>
                      <th className="pb-2">到期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subs.map((s) => (
                      <tr key={s.id} className="border-b border-white/5">
                        <td className="py-2 pr-4"><span className={`px-1.5 py-0.5 rounded text-xs ${planBadge(s.plan)}`}>{s.plan}</span></td>
                        <td className="py-2 pr-4"><span className={`text-xs ${s.status === 'active' ? 'text-emerald-400' : 'text-gray-500'}`}>{s.status}</span></td>
                        <td className="py-2 pr-4 text-gray-300 text-xs">{new Date(s.startAt).toLocaleDateString('zh-CN')}</td>
                        <td className="py-2 text-xs">{s.expireAt ? new Date(s.expireAt).toLocaleDateString('zh-CN') : '-'}{s.expireAt && new Date(s.expireAt) < new Date() ? ' ⚠️已过期' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders */}
          {result.orders && result.orders.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-2">📋 订单记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-white/5">
                      <th className="pb-2 pr-4">订单</th>
                      <th className="pb-2 pr-4">套餐</th>
                      <th className="pb-2 pr-4">金额</th>
                      <th className="pb-2 pr-4">支付</th>
                      <th className="pb-2 pr-4">状态</th>
                      <th className="pb-2">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.orders.map((o) => (
                      <tr key={o.id} className="border-b border-white/5">
                        <td className="py-2 pr-4"><code className="text-xs text-gray-400">{o.id.slice(0, 8)}...</code></td>
                        <td className="py-2 pr-4"><span className={`px-1.5 py-0.5 rounded text-xs ${planBadge(o.plan)}`}>{o.plan}</span></td>
                        <td className="py-2 pr-4">¥{(o.amount / 100).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-xs text-gray-400">{o.payMethod || '-'}</td>
                        <td className="py-2 pr-4"><span className={`text-xs ${o.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{o.status}</span></td>
                        <td className="py-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!result.subs || result.subs.length === 0) && (!result.orders || result.orders.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">该用户暂无订阅和订单记录</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: 修正 VIP ─────────────────────────────────
function FixVipTab() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/fix-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), correctPlan: plan }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || '操作失败');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-sm">
        ⚠️ 此操作会修改用户的订阅到期时间。请先在「查询用户」确认目标用户信息。
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">用户邮箱</label>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">目标套餐（决定到期时间）</label>
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {p === 'monthly' ? '📅 月付 (+30天)' : p === 'quarterly' ? '📅 季付 (+90天)' : '📅 年付 (+365天)'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleFix}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-medium rounded-lg transition-colors"
        >
          {loading ? '处理中...' : '🔧 修正 VIP'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {result && result.success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm space-y-2">
          <div className="font-medium text-emerald-400">✅ 修正成功</div>
          <div className="grid grid-cols-2 gap-2 text-gray-300">
            <div>邮箱：{result.user?.email}</div>
            <div>{result.user?.oldPlan} → <span className="text-amber-400">{result.user?.newPlan}</span></div>
            <div>旧到期：{result.user?.oldExpiry ? new Date(result.user.oldExpiry).toLocaleString('zh-CN') : '-'}</div>
            <div>新到期：<span className="text-emerald-400">{result.user?.newExpiry ? new Date(result.user.newExpiry).toLocaleString('zh-CN') : '-'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: 创建订阅 ─────────────────────────────────
function CreateSubTab() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), plan }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || '创建失败');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-200/80 text-sm">
        ℹ️ 为指定邮箱的用户创建新的订阅记录。如果用户不存在则会报错。
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">用户邮箱</label>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">套餐类型</label>
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {p === 'monthly' ? '月付' : p === 'quarterly' ? '季付' : '年付'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? '创建中...' : '➕ 创建订阅'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {result && result.success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm space-y-2">
          <div className="font-medium text-emerald-400">✅ 订阅创建成功</div>
          <div className="grid grid-cols-2 gap-2 text-gray-300">
            <div>套餐：<span className={`px-1.5 py-0.5 rounded text-xs ${planBadge(result.subscription?.plan)}`}>{result.subscription?.plan}</span></div>
            <div>状态：{result.subscription?.status}</div>
            <div>开始：{result.subscription?.startAt ? new Date(result.subscription.startAt).toLocaleString('zh-CN') : '-'}</div>
            <div>到期：{result.subscription?.expireAt ? new Date(result.subscription.expireAt).toLocaleString('zh-CN') : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────
function planBadge(plan: string): string {
  switch (plan) {
    case 'monthly': return 'bg-green-500/20 text-green-400';
    case 'quarterly': return 'bg-blue-500/20 text-blue-400';
    case 'yearly': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

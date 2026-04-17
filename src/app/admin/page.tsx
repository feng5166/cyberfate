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

  // 管理员邮箱白名单
  const ADMIN_EMAILS = ['feng5166@gmail.com', 'feng.5166@163.com'];

  if (status === 'loading') return <LoadingSpinner />;
  if (!session) return <LoginPrompt />;
  // 前端二次校验：非管理员邮箱禁止访问
  if (!session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">无权访问</h2>
          <p className="text-gray-500 text-sm">当前账号 ({session.user?.email}) 不在管理员列表中</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          ⚙️ 管理面板
        </h1>
        <p className="text-sm text-gray-500 mt-1">{session.user?.email} · 已认证</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
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
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'check' && <CheckUserTab />}
      {tab === 'fix-vip' && <FixVipTab />}
      {tab === 'create-sub' && <CreateSubTab />}
    </div>
  );
}

// ── Login Prompt ─────────────────────────────────────
function LoginPrompt() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">需要管理员权限</h2>
        <p className="text-gray-500 text-sm mb-6">请使用管理员账号登录后访问此页面</p>
        <button
          onClick={() => signIn()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
        >
          登录
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
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
    <div className="space-y-5">
      <div className="flex gap-3">
        <input
          type="email"
          placeholder="输入用户邮箱..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        />
        <button
          onClick={handleCheck}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-400 mb-3">👤 用户信息</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400 block text-xs mb-0.5">ID</span>
                <code className="text-xs text-gray-600 break-all bg-gray-50 px-2 py-1 rounded">{result.user?.id}</code>
              </div>
              <div>
                <span className="text-gray-400 block text-xs mb-0.5">邮箱</span>
                <span className="text-gray-900">{result.user?.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs mb-0.5">注册时间</span>
                <span className="text-gray-900">{result.user?.createdAt ? new Date(result.user.createdAt).toLocaleString('zh-CN') : '-'}</span>
              </div>
            </div>

            {/* 订阅状态摘要 */}
            {result.subs && result.subs.length > 0 && (() => {
              const activeSub = result.subs!.find((s: SubInfo) => s.status === 'active' && new Date(s.expireAt) > new Date());
              const latestSub = result.subs![0];
              const isVip = !!activeSub;
              const daysLeft = activeSub ? Math.ceil((new Date(activeSub.expireAt).getTime() - Date.now()) / 86400000) : null;
              return (
                <div className={`mt-4 pt-4 border-t border-gray-100 ${isVip ? 'bg-emerald-50/50 -mx-4 px-4 pb-4' : ''}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isVip ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isVip ? '✅ VIP 有效' : '❌ 非VIP'}
                    </span>
                    {latestSub && (
                      <>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${planBadge(latestSub.plan)}`}>{latestSub.plan}</span>
                        <span className="text-xs text-gray-400">
                          到期：{new Date(latestSub.expireAt).toLocaleDateString('zh-CN')}
                          {daysLeft !== null ? `（${daysLeft > 0 ? `剩${daysLeft}天` : '已过期'}）` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Subscriptions */}
          {result.subs && result.subs.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-400 mb-3">💳 订阅记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-100">
                      <th className="pb-2 pr-4 font-medium">套餐</th>
                      <th className="pb-2 pr-4 font-medium">状态</th>
                      <th className="pb-2 pr-4 font-medium">开始</th>
                      <th className="pb-2 font-medium">到期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subs.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(s.plan)}`}>{s.plan}</span></td>
                        <td className="py-2.5 pr-4"><span className={`text-xs font-medium ${s.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>{s.status}</span></td>
                        <td className="py-2.5 pr-4 text-gray-600 text-xs">{new Date(s.startAt).toLocaleDateString('zh-CN')}</td>
                        <td className="py-2.5 text-xs">
                          <span className={s.expireAt && new Date(s.expireAt) < new Date() ? 'text-red-400' : 'text-gray-600'}>
                            {s.expireAt ? new Date(s.expireAt).toLocaleDateString('zh-CN') : '-'}
                          </span>
                          {s.expireAt && new Date(s.expireAt) < new Date() ? ' ⚠️已过期' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders */}
          {result.orders && result.orders.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-400 mb-3">📋 订单记录</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-100">
                      <th className="pb-2 pr-4 font-medium">订单号</th>
                      <th className="pb-2 pr-4 font-medium">套餐</th>
                      <th className="pb-2 pr-4 font-medium">金额</th>
                      <th className="pb-2 pr-4 font-medium">支付方式</th>
                      <th className="pb-2 pr-4 font-medium">状态</th>
                      <th className="pb-2 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.orders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4"><code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{o.id.slice(0, 12)}...</code></td>
                        <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(o.plan)}`}>{o.plan}</span></td>
                        <td className="py-2.5 pr-4 text-gray-900">¥{(o.amount / 100).toFixed(2)}</td>
                        <td className="py-2.5 pr-4 text-xs text-gray-400">{o.payMethod || '-'}</td>
                        <td className="py-2.5 pr-4"><span className={`text-xs font-medium ${o.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{o.status}</span></td>
                        <td className="py-2.5 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!result.subs || result.subs.length === 0) && (!result.orders || result.orders.length === 0) && (
            <div className="text-center py-8 text-gray-400 text-sm">该用户暂无订阅和订单记录</div>
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
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
        ⚠️ 此操作会修改用户的订阅到期时间。请先在「查询用户」确认目标用户信息。
      </div>

      <div className="space-y-4 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户邮箱</label>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">目标套餐（决定到期时间）</label>
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p === 'monthly' ? '📅 月付 +30天' : p === 'quarterly' ? '📅 季付 +90天' : '📅 年付 +365天'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFix}
          disabled={loading || !email.trim()}
          className="w-full px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? '处理中...' : '🔧 修正 VIP'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      {result && result.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm space-y-2">
          <div className="font-medium text-emerald-700">✅ 修正成功</div>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <div><span className="text-gray-400">邮箱：</span>{result.user?.email}</div>
            <div><span className="text-gray-400">变更：</span>{result.user?.oldPlan} → <span className="text-amber-600 font-medium">{result.user?.newPlan}</span></div>
            <div><span className="text-gray-400">旧到期：</span>{result.user?.oldExpiry ? new Date(result.user.oldExpiry).toLocaleString('zh-CN') : '-'}</div>
            <div><span className="text-gray-400">新到期：</span><span className="text-emerald-600 font-medium">{result.user?.newExpiry ? new Date(result.user.newExpiry).toLocaleString('zh-CN') : '-'}</span></div>
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
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
        ℹ️ 为指定邮箱的用户创建新的订阅记录。如果用户不存在则会报错。
      </div>

      <div className="space-y-4 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户邮箱</label>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐类型</label>
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          className="w-full px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? '创建中...' : '➕ 创建订阅'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      {result && result.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm space-y-2">
          <div className="font-medium text-emerald-700">✅ 订阅创建成功</div>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <div><span className="text-gray-400">套餐：</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(result.subscription?.plan)}`}>{result.subscription?.plan}</span></div>
            <div><span className="text-gray-400">状态：</span>{result.subscription?.status}</div>
            <div><span className="text-gray-400">开始：</span>{result.subscription?.startAt ? new Date(result.subscription.startAt).toLocaleString('zh-CN') : '-'}</div>
            <div><span className="text-gray-400">到期：</span>{result.subscription?.expireAt ? new Date(result.subscription.expireAt).toLocaleString('zh-CN') : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────
function planBadge(plan: string): string {
  switch (plan) {
    case 'monthly': return 'bg-emerald-100 text-emerald-700';
    case 'quarterly': return 'bg-blue-100 text-blue-700';
    case 'yearly': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

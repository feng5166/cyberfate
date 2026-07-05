'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config';

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

type Tab = 'users' | 'check' | 'fix-vip' | 'create-sub' | 'llm';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>('users');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/admin/verify')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin === true))
        .catch(() => setIsAdmin(false));
    }
  }, [session?.user?.email]);

  if (status === 'loading' || (session && isAdmin === null)) return <LoadingSpinner />;
  if (!session) return <LoginPrompt />;
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">无权访问</h2>
          <p className="text-gray-500 text-sm">当前账号无管理员权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
          ['users', '👥 用户列表'],
          ['check', '🔍 查询用户'],
          ['fix-vip', '🔧 修正 VIP'],
          ['create-sub', '➕ 创建订阅'],
          ['llm', '🤖 AI 模型'],
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
      {tab === 'users' && <UserListTab />}
      {tab === 'check' && <CheckUserTab />}
      {tab === 'fix-vip' && <FixVipTab />}
      {tab === 'create-sub' && <CreateSubTab />}
      {tab === 'llm' && <LlmProviderTab />}
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
          className="px-6 py-2.5 bg-[#1C1A16] hover:bg-stone-600 text-white font-medium rounded-lg transition-colors"
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

// ── Tab 0: 用户列表 ─────────────────────────────────
interface AdminUserRow {
  id: string;
  email: string | null;
  nickname: string | null;
  createdAt: string;
  isVip: boolean;
  latestSubscription: {
    plan: string;
    status: string;
    expireAt: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  vipUsers: number;
  newUsersToday: number;
  monthRevenue: number;
}

type VipFilter = 'all' | 'vip' | 'free';
type UserSort = 'newest' | 'oldest' | 'active';

function UserListTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [vipFilter, setVipFilter] = useState<VipFilter>('all');
  const [sort, setSort] = useState<UserSort>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerEmail, setDrawerEmail] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'fix-vip' | 'create-sub'; email: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // 搜索 debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // 拉取用户列表
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      vipFilter,
      sort,
    });
    if (search) params.set('search', search);

    fetch(`/api/admin/users?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '加载失败');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, vipFilter, sort, refreshTick]);

  // 拉取统计数据
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '加载失败');
        return data;
      })
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, [refreshTick]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总用户数" value={stats ? stats.totalUsers.toLocaleString() : '—'} icon="👥" />
        <StatCard label="VIP 用户" value={stats ? stats.vipUsers.toLocaleString() : '—'} icon="⭐" />
        <StatCard label="今日新增" value={stats ? stats.newUsersToday.toLocaleString() : '—'} icon="🆕" />
        <StatCard label="本月收入" value={stats ? `$${stats.monthRevenue.toFixed(2)}` : '—'} icon="💰" />
      </div>

      {/* 筛选栏 */}
      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <input
          type="text"
          placeholder="搜索邮箱或昵称..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/30 focus:border-[#1C1A16]"
        />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {([
            ['all', '全部'],
            ['vip', '仅VIP'],
            ['free', '非VIP'],
          ] as [VipFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setVipFilter(key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                vipFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as UserSort);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/30 focus:border-[#1C1A16]"
        >
          <option value="newest">注册时间倒序</option>
          <option value="oldest">注册时间正序</option>
          <option value="active">最近活跃</option>
        </select>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      {/* 用户表格 */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-4 font-medium">用户</th>
                <th className="py-3 px-4 font-medium">注册时间</th>
                <th className="py-3 px-4 font-medium">VIP</th>
                <th className="py-3 px-4 font-medium">套餐</th>
                <th className="py-3 px-4 font-medium">到期时间</th>
                <th className="py-3 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-gray-50">
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-14 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">未找到匹配用户</td>
                </tr>
              ) : (
                users.map((u) => {
                  const expireAt = u.latestSubscription?.expireAt;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">{u.email || '-'}</div>
                        {u.nickname && <div className="text-xs text-gray-400 mt-0.5">{u.nickname}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {new Date(u.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.isVip ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.isVip ? '✅ VIP' : '— 普通'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.latestSubscription ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(u.latestSubscription.plan)}`}>
                            {u.latestSubscription.plan}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {expireAt ? (
                          <span className={new Date(expireAt) < new Date() ? 'text-red-400' : 'text-gray-600'}>
                            {new Date(expireAt).toLocaleDateString('zh-CN')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDrawerEmail(u.email || null)}
                          disabled={!u.email}
                          className="px-3 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 text-xs font-medium transition-colors"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <div>共 {total.toLocaleString()} 条 · 第 {page} / {totalPages} 页</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerEmail && (
        <UserDetailDrawer
          email={drawerEmail}
          onClose={() => setDrawerEmail(null)}
          onAction={(type) => setActionModal({ type, email: drawerEmail })}
        />
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          type={actionModal.type}
          email={actionModal.email}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            setActionModal(null);
            setRefreshTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function UserDetailDrawer({
  email,
  onClose,
  onAction,
}: {
  email: string;
  onClose: () => void;
  onAction: (type: 'fix-vip' | 'create-sub') => void;
}) {
  const [data, setData] = useState<{ user?: UserInfo; orders?: OrderInfo[]; subscriptions?: SubInfo[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/admin/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '加载失败');
        return json;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 遮罩 */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* 抽屉 */}
      <div className="w-full max-w-[480px] bg-white border-l border-gray-200 shadow-xl flex flex-col transform transition-transform translate-x-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-sm font-semibold text-gray-900">用户详情</div>
            <div className="text-xs text-gray-400 mt-0.5">{email}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && <div className="text-center py-8 text-gray-400 text-sm animate-pulse">加载中...</div>}
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          {data && (
            <>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm space-y-1.5">
                <div className="flex">
                  <span className="text-gray-400 w-20">ID</span>
                  <code className="text-xs text-gray-600 break-all">{data.user?.id}</code>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-20">注册</span>
                  <span className="text-gray-700 text-xs">
                    {data.user?.createdAt ? new Date(data.user.createdAt).toLocaleString('zh-CN') : '-'}
                  </span>
                </div>
              </div>

              {/* 订阅状态 */}
              {data.subscriptions && data.subscriptions.length > 0 && (() => {
                const activeSub = data.subscriptions!.find(
                  (s) => s.status === 'active' && new Date(s.expireAt) > new Date()
                );
                const latestSub = data.subscriptions![0];
                const isVip = !!activeSub;
                const daysLeft = activeSub
                  // eslint-disable-next-line react-hooks/purity
                  ? Math.ceil((new Date(activeSub.expireAt).getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div className={`p-3 rounded-lg border ${
                    isVip ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isVip ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isVip ? '✅ VIP 有效' : '❌ 非VIP'}
                      </span>
                      {latestSub && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(latestSub.plan)}`}>
                            {latestSub.plan}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(latestSub.expireAt).toLocaleDateString('zh-CN')}
                            {daysLeft !== null ? `（${daysLeft > 0 ? `剩${daysLeft}天` : '已过期'}）` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 订阅记录 */}
              {data.subscriptions && data.subscriptions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">💳 订阅记录</h4>
                  <div className="space-y-1.5">
                    {data.subscriptions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-gray-50">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${planBadge(s.plan)}`}>{s.plan}</span>
                        <span className={`font-medium ${s.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {s.status}
                        </span>
                        <span className="text-gray-500 ml-auto">
                          {new Date(s.startAt).toLocaleDateString('zh-CN')} → {new Date(s.expireAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 订单记录 */}
              {data.orders && data.orders.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">📋 订单记录</h4>
                  <div className="space-y-1.5">
                    {data.orders.map((o) => (
                      <div key={o.id} className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-gray-50">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${planBadge(o.plan)}`}>{o.plan}</span>
                        <span className="text-gray-900">${(o.amount / 100).toFixed(2)}</span>
                        <span className="text-gray-400">{o.payMethod || '-'}</span>
                        <span className={`font-medium ${o.status === 'paid' ? 'text-emerald-600' : 'text-stone-600'}`}>
                          {o.status}
                        </span>
                        <span className="text-gray-400 ml-auto">{new Date(o.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!data.subscriptions || data.subscriptions.length === 0) &&
                (!data.orders || data.orders.length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-sm">该用户暂无订阅和订单记录</div>
                )}
            </>
          )}
        </div>

        {/* 底部操作 */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onAction('fix-vip')}
            className="flex-1 px-4 py-2 rounded-lg bg-stone-100 text-[#1C1A16] hover:bg-stone-200 text-sm font-medium transition-colors"
          >
            🔧 修正VIP
          </button>
          <button
            onClick={() => onAction('create-sub')}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium transition-colors"
          >
            ➕ 创建订阅
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  type,
  email,
  onClose,
  onSuccess,
}: {
  type: 'fix-vip' | 'create-sub';
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [plan, setPlan] = useState<'daily' | 'lifetime' | 'yearly'>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFix = type === 'fix-vip';

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = isFix ? '/api/admin/fix-vip' : '/api/admin/create-subscription';
      const body = isFix ? { email, correctPlan: plan } : { email, plan };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isFix ? '🔧 修正 VIP' : '➕ 创建订阅'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">邮箱</label>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">{email}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">套餐</label>
            <div className="flex gap-2">
              {(['daily', 'lifetime', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    plan === p
                      ? (isFix ? 'bg-[#1C1A16] text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm')
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {PRICING_CONFIG[p as PlanId]?.adminShortLabel ?? p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40 ${
                isFix ? 'bg-[#1C1A16] hover:bg-stone-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? '处理中...' : '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: 查询用户 ─────────────────────────────────
function CheckUserTab() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ user?: UserInfo; orders?: OrderInfo[]; subscriptions?: SubInfo[] } | null>(null);
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
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/30 focus:border-[#1C1A16]"
        />
        <button
          onClick={handleCheck}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 bg-[#1C1A16] hover:bg-stone-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
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
            {result.subscriptions && result.subscriptions.length > 0 && (() => {
              const activeSub = result.subscriptions!.find((s: SubInfo) => s.status === 'active' && new Date(s.expireAt) > new Date());
              const latestSub = result.subscriptions![0];
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
          {result.subscriptions && result.subscriptions.length > 0 && (
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
                    {result.subscriptions.map((s) => (
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
                        <td className="py-2.5 pr-4 text-gray-900">${(o.amount / 100).toFixed(2)}</td>
                        <td className="py-2.5 pr-4 text-xs text-gray-400">{o.payMethod || '-'}</td>
                        <td className="py-2.5 pr-4"><span className={`text-xs font-medium ${o.status === 'paid' ? 'text-emerald-600' : 'text-stone-600'}`}>{o.status}</span></td>
                        <td className="py-2.5 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!result.subscriptions || result.subscriptions.length === 0) && (!result.orders || result.orders.length === 0) && (
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
  const [plan, setPlan] = useState<'daily' | 'lifetime' | 'yearly'>('daily');
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
      <div className="p-4 rounded-xl bg-stone-100 border border-stone-300 text-[#1C1A16] text-sm">
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
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/30 focus:border-[#1C1A16]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">目标套餐（决定到期时间）</label>
          <div className="flex gap-2">
            {(['daily', 'lifetime', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-[#1C1A16] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {`📅 ${PRICING_CONFIG[p as PlanId]?.adminLabel ?? p}`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFix}
          disabled={loading || !email.trim()}
          className="w-full px-6 py-2.5 bg-[#1C1A16] hover:bg-stone-600 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
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
            <div><span className="text-gray-400">变更：</span>{result.user?.oldPlan} → <span className="text-stone-600 font-medium">{result.user?.newPlan}</span></div>
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
  const [plan, setPlan] = useState<'daily' | 'lifetime' | 'yearly'>('daily');
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
            {(['daily', 'lifetime', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  plan === p
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PRICING_CONFIG[p as PlanId]?.adminShortLabel ?? p}
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

// ── Tab 4: AI 模型（LLM Provider 切换）─────────────────
interface LlmProviderRow {
  id: string;
  label: string;
  baseUrl: string;
  hasKey: boolean;
  active: boolean;
}
interface LlmStatus {
  active: string;
  providers: LlmProviderRow[];
}

function LlmProviderTab() {
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/llm')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '加载失败');
        return data;
      })
      .then((data) => setStatus(data))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const switchTo = async (provider: string) => {
    if (status?.active === provider) return;
    setSwitching(provider);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '切换失败');
      setStatus({ active: data.active, providers: data.providers });
      setNotice(`已切换到「${data.providers.find((p: LlmProviderRow) => p.id === provider)?.label ?? provider}」，即时全站生效。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '切换失败');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
        ℹ️ 切换当前生效的大模型接入点（provider）。两个 provider 模型名一致，切换只换接入网关 + 密钥，<span className="font-medium">即时对全站 AI 生效</span>；被选中的 provider 若请求失败会自动兜底到另一个。
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      {notice && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{notice}</div>}

      {loading && !status ? (
        <div className="text-center py-10 text-gray-400 text-sm animate-pulse">加载中...</div>
      ) : status ? (
        <div className="grid gap-3 md:grid-cols-2">
          {status.providers.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-xl border shadow-sm transition-all ${
                p.active ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-900">{p.label}</span>
                {p.active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500 text-white">
                    ● 当前生效
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                    待命（兜底）
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 break-all mb-1">{p.baseUrl}</div>
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  p.hasKey ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}>
                  {p.hasKey ? '✅ 已配置密钥' : '⚠️ 未配置密钥'}
                </span>
              </div>
              <button
                onClick={() => switchTo(p.id)}
                disabled={p.active || switching !== null || !p.hasKey}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  p.active ? 'bg-gray-100 text-gray-400' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {p.active ? '正在使用' : switching === p.id ? '切换中...' : !p.hasKey ? '缺少密钥无法切换' : '切换为主用'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <button
        onClick={load}
        disabled={loading}
        className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 disabled:opacity-40"
      >
        刷新状态
      </button>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────
function planBadge(plan: string): string {
  switch (plan) {
    case 'daily': return 'bg-emerald-100 text-emerald-700';
    case 'lifetime': return 'bg-blue-100 text-blue-700';
    case 'yearly': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

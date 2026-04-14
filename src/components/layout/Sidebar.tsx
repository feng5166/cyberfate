'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  Home,
  BarChart3,
  Sun,
  BookHeart,
  Sparkles,
  Layers,
  Compass,
  Star,
  Calendar,
  BookOpen,
  Clock,
  LogOut,
  Lock,
  User,
  PanelLeft,
  PanelLeftClose,
  type LucideIcon,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { SidebarGroup } from './SidebarGroup';

interface SidebarProps {
  collapsed?: boolean;
  onCollapseToggle?: (nextCollapsed: boolean) => void;
}

interface MenuItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  paidOnly?: boolean;
}

interface MenuGroupConfig {
  title: string;
  showDivider?: boolean;
  items: MenuItemConfig[];
}

const MENU_GROUPS: MenuGroupConfig[] = [
  {
    title: '首页',
    items: [
      { label: '首页', href: '/', icon: Home },
    ],
  },
  {
    title: '八字命理',
    items: [
      { label: '八字分析', href: '/bazi', icon: BarChart3 },
      { label: '每日运势', href: '/daily', icon: Sun },
      { label: '合婚分析', href: '/bazi/marriage', icon: BookHeart, paidOnly: true },
    ],
  },
  {
    title: '周易占卜',
    items: [
      { label: '梅花易数', href: '/meihua', icon: Sparkles, paidOnly: true },
      { label: '塔罗占卜', href: '/tarot', icon: Layers },
      { label: '六爻占卜', href: '/liuyao', icon: Compass, paidOnly: true },
    ],
  },
  {
    title: '更多工具',
    items: [
      { label: '紫微斗数', href: '/ziwei', icon: Star, paidOnly: true },
      { label: 'AI老黄历', href: '/huangli', icon: Calendar, paidOnly: true },
    ],
  },
  {
    title: '个人中心',
    showDivider: true,
    items: [
      { label: '知识库', href: '/knowledge', icon: BookOpen },
      { label: '历史记录', href: '/history', icon: Clock },
    ],
  },
];

const normalizePath = (path?: string) => {
  if (!path) return '/';
  if (path === '/') return '/';
  return path.replace(/\/$/, '') || '/';
};

export function Sidebar({
  collapsed: collapsedProp,
  onCollapseToggle,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const normalizedPath = useMemo(() => normalizePath(pathname), [pathname]);
  const { data: session } = useSession();

  const status: 'guest' | 'free' | 'paid' = useMemo(() => {
    if (!session) return 'guest';
    return (session.user as any)?.isSubscribed === true ? 'paid' : 'free';
  }, [session]);

  const user = useMemo(() => ({
    name: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    avatar: session?.user?.image ?? undefined,
  }), [session]);

  const logout = () => signOut({ callbackUrl: '/' });

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;

  const handleCollapseToggle = () => {
    const next = !collapsed;
    if (collapsedProp === undefined) {
      setInternalCollapsed(next);
    }
    onCollapseToggle?.(next);
  };

  const [avatarError, setAvatarError] = useState(false);

  const renderAvatar = (size: 'sm' | 'md') => {
    const name = user?.name?.trim() || '访客';
    const initial = name.charAt(0).toUpperCase();
    const imageUrl = user?.avatar;
    const sizeClass = size === 'sm' ? 'h-10 w-10' : 'h-11 w-11';

    if (imageUrl && !avatarError) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover shrink-0`}
          onError={() => setAvatarError(true)}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-brand-bg text-sm font-semibold text-brand-gray shrink-0`}>
        {initial}
      </div>
    );
  };

  const UnlockButton = () => (
    <button
      type="button"
      onClick={() => router.push('/pricing')}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C1A16] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2A2620]"
    >
      <Lock className="h-4 w-4" />
      解锁全部功能
    </button>
  );

  const renderGuestBottom = (isCollapsed: boolean) => (
    <div className="border-t border-brand-border-light px-4 py-4">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1A16] text-white transition-colors hover:bg-[#2A2620]"
            title="解锁全部功能"
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#1C1A16] transition-colors hover:bg-[#F9FAFB]"
            title="登录 / 注册"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <UnlockButton />
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#1C1A16] transition-colors hover:bg-[#F9FAFB]"
          >
            <User className="h-4 w-4" />
            登录 / 注册
          </button>
        </div>
      )}
    </div>
  );

  const renderFreeBottom = (isCollapsed: boolean) => (
    <div className="border-t border-brand-border-light px-4 py-4">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1A16] text-white transition-colors hover:bg-[#2A2620]"
            title="解锁全部功能"
          >
            <Lock className="h-4 w-4" />
          </button>
          {renderAvatar('sm')}
        </div>
      ) : (
        <div className="space-y-4">
          <UnlockButton />
          <div className="flex items-center gap-3">
            {renderAvatar('md')}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-black">
                {user?.name || '用户'}
              </p>
              <p className="truncate text-xs text-[#9CA3AF]">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
            >
              <User className="h-3.5 w-3.5" />
              <span>个人资料</span>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaidBottom = (isCollapsed: boolean) => (
    <div className="border-t border-brand-border-light px-5 py-4">
      {isCollapsed ? (
        <div className="flex justify-center">{renderAvatar('sm')}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {renderAvatar('md')}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-brand-black">
                  {user?.name || '用户'}
                </p>
                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  VIP
                </span>
              </div>
              <p className="truncate text-xs text-[#9CA3AF]">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
            >
              <User className="h-3.5 w-3.5" />
              <span>个人资料</span>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderBottomArea = (isCollapsed: boolean) => {
    switch (status) {
      case 'guest':
        return renderGuestBottom(isCollapsed);
      case 'free':
        return renderFreeBottom(isCollapsed);
      case 'paid':
        return renderPaidBottom(isCollapsed);
    }
  };

  const SidebarContent = (isCollapsed: boolean) => (
    <div className="relative flex h-full flex-col bg-white">
      <div className="px-5 py-5">
        <Link
          href="/"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}
        >
          <img src="/favicon.svg" alt="" className="w-7 h-7 shrink-0" />
          {!isCollapsed && (
            <span className="font-display text-lg tracking-widest text-brand-black">CYBERFATE</span>
          )}
        </Link>
      </div>

      {!isCollapsed && (
        <button
          type="button"
          onClick={handleCollapseToggle}
          className="absolute right-2 top-3 hidden h-7 w-7 items-center justify-center rounded-md text-brand-gray hover:bg-gray-100/50 hover:text-brand-black lg:flex"
          title="收起导航"
          aria-label="收起导航"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      )}

      {isCollapsed && (
        <div className="hidden border-t border-b border-brand-border-light py-3 px-2 lg:block">
          <button
            type="button"
            onClick={handleCollapseToggle}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-[#1C1A16] transition-colors hover:bg-amber-100"
            title="展开导航"
            aria-label="展开导航"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto pb-6">
        {MENU_GROUPS.map((group) => (
          <SidebarGroup
            key={group.title}
            title={group.title}
            collapsed={isCollapsed}
            showDivider={group.showDivider}
            className="mb-1"
          >
            {group.items.map((item) => (
              <SidebarMenuItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={isCollapsed}
                active={normalizedPath === normalizePath(item.href)}
                locked={item.paidOnly && status !== 'paid'}
              />
            ))}
          </SidebarGroup>
        ))}
      </nav>

      {renderBottomArea(isCollapsed)}
    </div>
  );

  const desktopAsideClasses = clsx(
    'hidden lg:block fixed left-0 top-16 h-[calc(100vh-64px)] z-30 border-r border-brand-border-light bg-white shadow-sm transition-all duration-300 ease',
    collapsed ? 'w-16' : 'w-[260px]'
  );

  return (
    <aside className={desktopAsideClasses}>{SidebarContent(collapsed)}</aside>
  );
}

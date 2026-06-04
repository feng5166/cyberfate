'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
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
  Music,
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
import { AuthModal } from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/pricing/UpgradeModal';

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
      { label: '音乐运势签', href: '/music-oracle', icon: Music },
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

  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const shouldOpenUpgrade = useRef(false);
  const prevSession = useRef(session);

  useEffect(() => {
    if (!prevSession.current && session && shouldOpenUpgrade.current) {
      shouldOpenUpgrade.current = false;
      setUpgradeModalOpen(true);
    }
    prevSession.current = session;
  }, [session]);

  useEffect(() => {
    const isSubscribed = (session?.user as any)?.isSubscribed;
    console.log('[Sidebar] isSubscribed changed:', isSubscribed, '| session:', !!session);
    if (isSubscribed === true) {
      console.log('[Sidebar] isSubscribed=true, closing UpgradeModal');
      setUpgradeModalOpen(false);
    }
  }, [(session?.user as any)?.isSubscribed]);

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
    const fallbackSource = status === 'paid'
      ? (user?.email?.trim() || user?.name?.trim() || 'V')
      : (user?.name?.trim() || '访客');
    const initial = fallbackSource.charAt(0).toUpperCase();
    const imageUrl = user?.avatar;
    const sizeClass = size === 'sm' ? 'h-10 w-10' : 'h-11 w-11';

    if (imageUrl && !avatarError) {
      return (
        <img
          src={imageUrl}
          alt={user?.name || 'avatar'}
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

  const handleUnlock = () => {
    if (!session) {
      shouldOpenUpgrade.current = true;
      setAuthOpen(true);
    } else {
      setUpgradeModalOpen(true);
    }
  };

  const UnlockButton = () => (
    <button
      type="button"
      onClick={handleUnlock}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C1A16] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2A2620]"
    >
      <Lock className="h-4 w-4" />
      解锁全部功能
    </button>
  );

  const renderGuestBottom = (isCollapsed: boolean) => (
    <div className="border-t border-[#1C1A16]/[0.06] px-4 py-4">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleUnlock}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1A16] text-white transition-colors hover:bg-[#2A2620]"
            title="解锁全部功能"
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
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
            onClick={() => setAuthOpen(true)}
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
    <div className="border-t border-[#1C1A16]/[0.06] px-4 py-4">
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleUnlock}
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
                {'免费用户'}
              </p>
              <p className="truncate text-xs text-[#9CA3AF]">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#1C1A16] transition-colors hover:bg-[#F5F2ED]"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              <span>个人资料</span>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F5F2ED] hover:text-[#1C1A16]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaidBottom = (isCollapsed: boolean) => (
    <div className="border-t border-[#1C1A16]/[0.06] px-5 py-4">
      {isCollapsed ? (
        <div className="flex justify-center">{renderAvatar('sm')}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {renderAvatar('md')}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-brand-black">
                  {user?.email?.split('@')[0] || 'VIP'}
                </p>
                <span className="shrink-0 rounded bg-[#C2762B]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#C2762B]">
                  VIP
                </span>
              </div>
              <p className="truncate text-xs text-[#9CA3AF]">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#1C1A16] transition-colors hover:bg-[#F5F2ED]"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              <span>个人资料</span>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F5F2ED] hover:text-[#1C1A16]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
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
    <div className="relative flex h-full flex-col bg-[#FAF9F6]">
      <div className="px-5 py-5">
        <Link
          href="/"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}
        >
          <img src="/favicon.svg" alt="CyberFate" className="w-7 h-7 shrink-0" />
          {!isCollapsed && (
            <span className="font-display text-lg tracking-widest text-brand-black">CYBERFATE</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto pb-6 sidebar-scroll">
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
    'hidden lg:block fixed left-0 top-0 h-screen z-30 bg-[#FAF9F6] shadow-sm transition-all duration-300 ease w-[260px]',
    collapsed ? '-translate-x-full border-r-0' : 'translate-x-0 border-r border-brand-border-light'
  );

  return (
    <>
      <aside className={desktopAsideClasses}>{SidebarContent(collapsed)}</aside>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </>
  );
}

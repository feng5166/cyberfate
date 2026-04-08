'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { SidebarGroup } from './SidebarGroup';

interface SidebarProps {
  collapsed?: boolean;
  onCollapseToggle?: (nextCollapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: '合婚分析', href: '/bazi/marriage', icon: BookHeart },
    ],
  },
  {
    title: '周易占卜',
    items: [
      { label: '梅花易数', href: '/meihua', icon: Sparkles },
      { label: '塔罗占卜', href: '/tarot', icon: Layers },
      { label: '六爻占卜', href: '/liuyao', icon: Compass },
    ],
  },
  {
    title: '更多工具',
    items: [
      { label: '紫微斗数', href: '/ziwei', icon: Star },
      { label: 'AI 黄历', href: '/huangli', icon: Calendar },
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
  mobileOpen = false,
  onMobileClose,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const normalizedPath = useMemo(() => normalizePath(pathname), [pathname]);
  const { data: session } = useSession();
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

  const renderAvatar = (isCollapsed: boolean) => {
    const name = session?.user?.name?.trim() || '访客';
    const initial = name.charAt(0).toUpperCase();
    const imageUrl = session?.user?.image;
    const sizeClass = isCollapsed ? 'h-10 w-10' : 'h-11 w-11';

    if (imageUrl && !avatarError) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
          onError={() => setAvatarError(true)}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-brand-bg text-sm font-semibold text-brand-gray`}>
        {initial}
      </div>
    );
  };

  const renderUserArea = (isCollapsed: boolean) => (
    <div className="border-t border-brand-border-light px-5 py-4">
      {isCollapsed ? (
        <div className="flex justify-center">{renderAvatar(true)}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {renderAvatar(false)}
            <div>
              <p className="text-sm font-semibold text-brand-black">{session?.user?.name || '未登录用户'}</p>
              <p className="text-xs text-[#9CA3AF]">{session?.user?.email || '未绑定邮箱'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
              onClick={onMobileClose}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>设置</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-brand-black"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>退出</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const SidebarContent = (isCollapsed: boolean) => (
    <div className="relative flex h-full flex-col bg-white">
      <div className="px-5 py-5">
        <Link
          href="/"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}
          onClick={onMobileClose}
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
                onSelect={onMobileClose}
              />
            ))}
          </SidebarGroup>
        ))}
      </nav>

      {renderUserArea(isCollapsed)}

      {isCollapsed && (
        <div className="hidden border-t border-brand-border-light px-2 py-3 lg:block">
          <button
            type="button"
            onClick={handleCollapseToggle}
            className="flex h-7 w-full items-center justify-center rounded-md text-brand-gray hover:bg-gray-100/50 hover:text-brand-black"
            title="展开导航"
            aria-label="展开导航"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  const desktopAsideClasses = clsx(
    'hidden lg:block fixed left-0 top-16 h-[calc(100vh-64px)] z-30 border-r border-brand-border-light bg-white shadow-sm transition-all duration-300 ease',
    collapsed ? 'w-16' : 'w-[260px]'
  );

  return (
    <>
      <aside className={desktopAsideClasses}>{SidebarContent(collapsed)}</aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-16 bottom-0 z-50 w-[260px] border-r border-brand-border-light bg-white shadow-xl lg:hidden">
            {SidebarContent(false)}
          </aside>
        </>
      )}
    </>
  );
}

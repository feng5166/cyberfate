'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Heart, 
  Calendar, 
  Compass, 
  BookOpen, 
  Puzzle,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  items?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: '八字解命',
    icon: <Sparkles className="w-5 h-5" />,
    items: [
      { label: '八字计算', href: '/bazi' },
      { label: '八字合婚', href: '/bazi/marriage' },
      { label: '每日运势', href: '/daily' },
    ],
  },
  {
    label: '紫微斗数',
    icon: <Compass className="w-5 h-5" />,
    items: [
      { label: '紫微排盘', href: '/ziwei' },
    ],
  },
  {
    label: '周易占卜',
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      { label: '梅花易数', href: '/meihua' },
      { label: '六爻', href: '/liuyao' },
    ],
  },
  {
    label: '塔罗牌',
    icon: <Puzzle className="w-5 h-5" />,
    items: [
      { label: '塔罗占卜', href: '/tarot' },
    ],
  },
  {
    label: '其他功能',
    icon: <Calendar className="w-5 h-5" />,
    items: [
      { label: 'AI 老黄历', href: '/huangli' },
      { label: '历史记录', href: '/history' },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  // 找到当前页面所在的分组，确保它初始化时是展开的
  const getCurrentGroup = () => {
    for (const group of NAV_ITEMS) {
      if (group.items?.some(item => pathname === item.href)) {
        return group.label;
      }
    }
    return null;
  };

  // 初始化：当前页面所在分组展开，其他分组也展开（全部展开）
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const allGroups = new Set(NAV_ITEMS.map(item => item.label));
    return allGroups;
  });

  const toggleGroup = (label: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedGroups(newExpanded);
  };

  const handleLinkClick = () => {
    // 移动端点击链接后关闭侧边栏
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          {!collapsed && (
            <>
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg font-bold text-primary">
                CyberFate
              </span>
            </>
          )}
          {collapsed && <Sparkles className="w-6 h-6 text-primary" />}
        </Link>
        
        {/* 桌面端折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4 rotate-90" />
          )}
        </button>

        {/* 移动端关闭按钮 */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((group) => {
          const isExpanded = expandedGroups.has(group.label);
          
          return (
            <div key={group.label} className="mb-1">
              {/* 分组标题 */}
              <button
                onClick={() => !collapsed && toggleGroup(group.label)}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 rounded
                  hover:bg-gray-100 transition-colors
                  ${collapsed ? 'justify-center' : 'justify-between'}
                `}
              >
                <div className="flex items-center gap-2">
                  {group.icon}
                  {!collapsed && (
                    <span className="font-medium text-sm text-secondary">
                      {group.label}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? '' : '-rotate-90'
                    }`}
                  />
                )}
              </button>

              {/* 子菜单 */}
              {!collapsed && isExpanded && group.items && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    // 路径匹配：支持精确匹配和前缀匹配
                    const normalizedPathname = pathname?.replace(/\/$/, '') || '';
                    const normalizedHref = item.href.replace(/\/$/, '');
                    const isActive = normalizedPathname === normalizedHref || 
                                   normalizedPathname.startsWith(normalizedHref + '/');
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          block px-3 py-1.5 rounded text-sm transition-all
                          ${
                            isActive
                              ? 'bg-gray-100 text-black font-semibold'
                              : 'text-gray-700 font-normal hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 底部用户信息（占位） */}
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <Link
            href="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">👤</span>
            </div>
            <span className="text-sm text-secondary">个人中心</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm">👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside
        className={`
          hidden lg:block
          fixed left-0 top-0 h-screen
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
          z-40
        `}
      >
        <SidebarContent />
      </aside>

      {/* 移动端抽屉 */}
      {mobileOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onMobileClose}
          />
          
          {/* 抽屉 */}
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 z-50 animate-slide-in-left">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

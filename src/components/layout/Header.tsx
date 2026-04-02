'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Sparkles, Menu } from 'lucide-react';

const navItems = [
  { label: '首页', href: '/', available: true },
  { label: '八字分析', href: '/bazi', available: true },
  { label: '每日运势', href: '/daily', available: true },
  { label: '八字合婚', href: '/bazi/marriage', available: true },
  { label: '紫微斗数', href: '/ziwei', available: true },
  { label: '梅花易数', href: '/meihua', available: true },
  { label: 'AI 黄历', href: '/huangli', available: true },
  { label: '塔罗占卜', href: '/tarot', available: true },
  { label: '定价', href: '/pricing', available: true },
];

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps = {}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="bg-white border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* 移动端汉堡菜单 */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 -ml-2 text-secondary hover:text-primary"
            aria-label="打开菜单"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" strokeWidth={2} />
            <span className="font-heading text-xl font-semibold text-primary">
              赛博命理师
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.available ? item.href : '#'}
                className={`text-sm ${
                  item.available
                    ? 'text-secondary hover:text-primary'
                    : 'text-muted cursor-not-allowed'
                } transition-colors`}
                onClick={(e) => !item.available && e.preventDefault()}
              >
                {item.label}
                {!item.available && <span className="ml-1 text-xs">(即将上线)</span>}
              </Link>
            ))}
            {/* 登录后显示工作台 */}
            {session && (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <span className="px-4 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 cursor-pointer transition-colors inline-block">
                  工作台
                </span>
                {userMenuOpen && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="py-2 bg-white rounded-lg shadow-lg border border-border min-w-[140px]">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-primary hover:bg-background-alt transition-colors"
                      >
                        个人中心
                      </Link>
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-primary hover:bg-background-alt transition-colors"
                      >
                        我的会员
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-background-alt transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auth Area - 只显示登录按钮 */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'unauthenticated' && (
              <Link
                href="/auth/login"
                className="px-4 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
}

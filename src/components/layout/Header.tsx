'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Sparkles } from 'lucide-react';

const navItems = [
  { label: '首页', href: '/', available: true },
  { label: '八字分析', href: '/bazi', available: true },
  { label: '博客', href: '/blog', available: false },
  { label: '定价', href: '/pricing', available: true },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-white">
      <nav className="max-w-7xl mx-auto px-10">
        <div className="flex items-center justify-between h-16">
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
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="px-4 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                  工作台
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 py-2 bg-white rounded-lg shadow-lg border border-border min-w-[140px]">
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
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4">
            {/* Mobile Auth */}
            <div className="px-2 pb-3 border-b border-border mb-3">
              {session ? (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="block py-2 text-sm text-primary hover:bg-background-alt rounded px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    个人中心
                  </Link>
                  <Link
                    href="/pricing"
                    className="block py-2 text-sm text-primary hover:bg-background-alt rounded px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    我的会员
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left py-2 text-sm text-primary hover:bg-background-alt rounded px-2"
                  >
                    退出登录
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="block text-center py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
              )}
            </div>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.available ? item.href : '#'}
                className={`block px-4 py-2 text-sm ${
                  item.available
                    ? 'text-primary hover:bg-background-alt'
                    : 'text-muted cursor-not-allowed'
                } transition-colors`}
                onClick={(e) => {
                  if (!item.available) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                {item.label}
                {!item.available && <span className="ml-2 text-xs">(即将上线)</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

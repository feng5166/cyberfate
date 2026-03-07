'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  {
    label: '八字算命',
    children: [
      { label: '八字计算', href: '/bazi', available: true },
      { label: '八字合婚', href: '/bazi/marriage', available: false },
      { label: '每日运势', href: '/daily', available: true },
    ],
  },
  {
    label: '紫微斗数',
    children: [
      { label: '紫微排盘', href: '/ziwei', available: false },
    ],
  },
  {
    label: '周易占卜',
    children: [
      { label: '梅花易数', href: '/meihua', available: false },
      { label: '六爻', href: '/liuyao', available: false },
    ],
  },
  { label: '塔罗牌', href: '/tarot', available: false },
  { label: 'AI黄历', href: '/huangli', available: false },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-cyber-bg/95 backdrop-blur-sm border-b border-cyber-gold/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <span className="font-heading text-xl font-semibold text-cyber-gold">
              赛博命理师
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children ? (
                  <>
                    <button className="text-text-secondary hover:text-cyber-gold transition-colors py-2">
                      {item.label}
                    </button>
                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 py-2 bg-cyber-card rounded-lg shadow-lg border border-cyber-gold/10 min-w-[140px]">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.available ? child.href : '#'}
                            className={`block px-4 py-2 text-sm ${
                              child.available
                                ? 'text-text-primary hover:text-cyber-gold hover:bg-cyber-bg/50'
                                : 'text-text-muted cursor-not-allowed'
                            } transition-colors`}
                            onClick={(e) => !child.available && e.preventDefault()}
                          >
                            {child.label}
                            {!child.available && (
                              <span className="ml-2 text-xs text-text-muted">(即将上线)</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.available ? item.href! : '#'}
                    className={`py-2 ${
                      item.available
                        ? 'text-text-secondary hover:text-cyber-gold'
                        : 'text-text-muted cursor-not-allowed'
                    } transition-colors`}
                    onClick={(e) => !item.available && e.preventDefault()}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
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
                <button className="flex items-center gap-2 text-text-secondary hover:text-cyber-gold transition-colors py-2">
                  <div className="w-8 h-8 rounded-full bg-cyber-gold/20 border border-cyber-gold/40 flex items-center justify-center text-cyber-gold text-sm font-semibold">
                    {session.user?.name?.[0] ?? session.user?.email?.[0] ?? '?'}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 py-2 bg-cyber-card rounded-lg shadow-lg border border-cyber-gold/10 min-w-[140px]">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-text-primary hover:text-cyber-gold hover:bg-cyber-bg/50 transition-colors"
                    >
                      个人中心
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:text-red-400 hover:bg-cyber-bg/50 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm border border-cyber-gold/40 text-cyber-gold rounded-lg hover:bg-cyber-gold/10 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-cyber-gold"
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
          <div className="md:hidden py-4 border-t border-cyber-gold/10">
            {/* Mobile Auth */}
            <div className="px-2 pb-3 border-b border-cyber-gold/10 mb-3">
              {session ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{session.user?.email}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block text-center py-2 border border-cyber-gold/40 text-cyber-gold rounded-lg text-sm hover:bg-cyber-gold/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录 / 注册
                </Link>
              )}
            </div>

            {navItems.map((item) => (
              <div key={item.label} className="py-2">
                {item.children ? (
                  <>
                    <div className="text-text-muted text-sm px-2 mb-1">{item.label}</div>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.available ? child.href : '#'}
                        className={`block px-4 py-2 ${
                          child.available
                            ? 'text-text-primary hover:text-cyber-gold'
                            : 'text-text-muted'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.label}
                        {!child.available && <span className="ml-2 text-xs">(即将上线)</span>}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    href={item.available ? item.href! : '#'}
                    className={`block px-4 py-2 ${
                      item.available ? 'text-text-primary hover:text-cyber-gold' : 'text-text-muted'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                    {!item.available && <span className="ml-2 text-xs">(即将上线)</span>}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

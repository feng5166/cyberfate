'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

// 主导航项（桌面端直接展示，移动端平铺）
const mainNavItems = [
  { label: '首页', href: '/' },
  { label: '八字分析', href: '/bazi' },
  { label: '每日运势', href: '/daily' },
  { label: '塔罗占卜', href: '/tarot' },
  { label: '紫微斗数', href: '/ziwei' },
];

// "更多"下拉菜单项
const moreMenuItems = [
  { label: '音乐运势签', href: '/music-oracle' },
  { label: '合婚配对', href: '/bazi/marriage' },
  { label: '黄历查询', href: '/huangli' },
  { label: '知识库', href: '/knowledge' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen]);

  return (
    <header
      className={`relative z-50 border-b border-[#1C1A16]/10 ${
        isHomePage ? 'bg-[rgba(255,255,255,0.95)]' : 'bg-[rgba(255,255,255,0.9)]'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* 左侧：移动端汉堡 + Logo */}
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单 - 任务1: 扩大触摸热区到 44×44px */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden min-w-[44px] min-h-[44px] p-3 -ml-2 text-brand-gray hover:text-[#1C1A16] transition-transform duration-200 active:scale-95 relative z-[10000]"
              aria-label="菜单"
              aria-expanded={mobileOpen}
            >
              <div className="transition-transform duration-200">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </div>
            </button>

            {/* Logo - 衬线体 */}
            <Link href="/" className="flex items-center gap-2 font-display text-lg md:text-xl text-[#1C1A16] tracking-widest hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="CyberFate 赛博命理师" className="w-7 h-7" />
              CYBERFATE
            </Link>
          </div>

          {/* Desktop Nav - 中间 */}
          <div className="hidden lg:flex items-center gap-8">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors duration-200 ${pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`}
              >
                {item.label}
              </Link>
            ))}
            <div
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                className={`flex items-center gap-1 text-sm transition-colors duration-200 ${
                  moreMenuItems.some((item) => pathname === item.href)
                    ? 'text-[#1C1A16] font-medium'
                    : 'text-brand-gray hover:text-[#1C1A16]'
                }`}
              >
                更多
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2">
                  <div className="py-2 bg-white rounded-lg shadow-lg border border-brand-border-light min-w-[130px] animate-fadeIn">
                    {moreMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          pathname === item.href
                            ? 'text-[#1C1A16] font-medium bg-brand-bg'
                            : 'text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/pricing"
              className={`text-sm transition-colors duration-200 ${pathname === '/pricing' ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`}
            >
              定价
            </Link>
          </div>

          {/* 右侧：桌面端账户/登录 */}
          <div className="hidden lg:flex items-center gap-4">
            {session ? (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 text-sm text-brand-gray hover:text-[#1C1A16] cursor-pointer transition-colors duration-200">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="用户头像" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-brand-bg flex items-center justify-center text-xs font-medium text-[#1C1A16]">
                      {session.user?.name?.[0] || '我'}
                    </span>
                  )}
                  {'个人中心'}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2">
                    <div className="py-2 bg-white rounded-lg shadow-lg border border-brand-border-light min-w-[140px] animate-fadeIn">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors"
                      >
                        个人中心
                      </Link>
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors"
                      >
                        我的会员
                      </Link>
                      <hr className="my-1 border-brand-border-light" />
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left px-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="text-sm text-brand-gray hover:text-[#1C1A16] transition-colors duration-200"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 移动端遮罩层 - S-task4: 添加遮罩层动画 */}
      {mobileOpen && (
      <div 
        className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200 animate-fadeIn"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
    )}

    {/* 移动端下拉菜单 - S-task2/S-task4/S-task6: 完整导航 + 动画 - 放在 header 外部 */}
    {mobileOpen && (
        <div 
          className="fixed left-0 right-0 top-16 bottom-0 z-50 lg:hidden bg-white overflow-y-auto animate-slideDown"
        >
          <div className="px-4 py-4 space-y-1">
            {/* 主导航项 */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-3 text-sm transition-colors active:bg-brand-bg ${
                  pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* 更多 */}
            <div className="pt-2 border-t border-brand-border-light mt-2">
              <p className="px-2 py-2 text-xs text-brand-light font-medium tracking-wide">更多</p>
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block pl-4 py-2.5 text-sm transition-colors active:bg-brand-bg ${
                    pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* 定价 */}
            <div className="pt-2 border-t border-brand-border-light mt-2">
              <Link
                href="/pricing"
                className={`block py-3 text-sm transition-colors active:bg-brand-bg ${
                  pathname === '/pricing' ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                定价
              </Link>
            </div>

            {/* 登录/账户 */}
            <div className="pt-2 border-t border-brand-border-light mt-2">
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className="block py-3 text-sm text-brand-gray hover:text-[#1C1A16] active:bg-brand-bg transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileOpen(false);
                    }}
                    className="block w-full text-left py-3 text-sm text-brand-gray hover:text-[#1C1A16] active:bg-brand-bg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  className="block w-full text-left py-3 text-sm text-[#1C1A16] font-medium active:bg-brand-bg transition-colors"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                >
                  登录 / 注册
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}

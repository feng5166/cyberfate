'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// 导航项配置
const navItems = [
  { label: '首页', href: '/' },
  { label: '定价', href: '/pricing' },
];

// 功能下拉菜单
const featureMenu = [
  { label: '八字分析', href: '/bazi' },
  { label: '每日运势', href: '/daily' },
  { label: '八字合婚', href: '/bazi/marriage' },
  { label: '紫微斗数', href: '/ziwei' },
  { label: '梅花易数', href: '/meihua' },
  { label: '塔罗占卜', href: '/tarot' },
  { label: 'AI 黄历', href: '/huangli' },
];

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  onWorkbenchClick?: () => void;
  showWorkbench?: boolean;
}

export function Header({
  onMobileMenuToggle,
  showMobileMenu = false,
  onWorkbenchClick,
  showWorkbench = false,
}: NavbarProps = {}) {
  const [featureOpen, setFeatureOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const handleWorkbenchAction = () => {
    if (onWorkbenchClick) {
      onWorkbenchClick();
    } else if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  return (
    <header
      className={`border-b border-[#1C1A16]/10 ${
        isHomePage ? 'bg-white/95 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-md'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* 左侧：移动端汉堡 + Logo */}
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单 */}
            {(showMobileMenu || true) && (
              <button
                onClick={() => {
                  if (onMobileMenuToggle) onMobileMenuToggle();
                  else setMobileOpen(!mobileOpen);
                }}
                className="lg:hidden p-2 -ml-2 text-brand-gray hover:text-[#1C1A16]"
                aria-label="菜单"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Logo - 衬线体 */}
            <Link href="/" className="font-display text-lg md:text-xl text-[#1C1A16] tracking-widest hover:opacity-70 transition-opacity">
              CYBERFATE
            </Link>
          </div>

          {/* Desktop Nav - 中间 */}
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-brand-gray hover:text-[#1C1A16] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}

            {/* 功能下拉菜单 */}
            <div
              className="relative"
              onMouseEnter={() => setFeatureOpen(true)}
              onMouseLeave={() => setFeatureOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm text-brand-gray hover:text-[#1C1A16] transition-colors duration-200">
                功能
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${featureOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {featureOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="bg-white rounded-lg shadow-lg border border-brand-border-light py-2 min-w-[160px] animate-fadeIn">
                    {featureMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 工作台（登录后显示）或 登录按钮 */}
            {session ? (
              showWorkbench ? (
                <Button
                  variant="text"
                  className="text-sm text-brand-gray hover:text-[#1C1A16]"
                  onClick={handleWorkbenchAction}
                >
                  工作台
                </Button>
              ) : null
            ) : (
              <Link
                href="/auth/login"
                className="text-sm text-brand-gray hover:text-[#1C1A16] transition-colors duration-200"
              >
                登录
              </Link>
            )}
          </div>

          {/* 右侧：桌面端账户/登录 */}
          <div className="hidden lg:flex items-center gap-4">
            {session && (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <span className="text-sm text-brand-gray hover:text-[#1C1A16] cursor-pointer transition-colors duration-200">
                  账户
                </span>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2">
                    <div className="py-2 bg-white rounded-lg shadow-lg border border-brand-border-light min-w-[140px]">
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
            )}
          </div>
        </div>
      </nav>

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-brand-border-light bg-white animate-fadeIn">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2.5 text-sm text-brand-gray hover:text-[#1C1A16]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {session && showWorkbench && (
              <button
                className="w-full text-left py-2.5 text-sm text-brand-gray hover:text-[#1C1A16]"
                onClick={() => {
                  handleWorkbenchAction();
                  setMobileOpen(false);
                }}
              >
                工作台
              </button>
            )}
            
            <div className="pt-2 border-t border-brand-border-light mt-2">
              <p className="px-2 py-1 text-xs text-brand-light font-medium">功能</p>
              {featureMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block pl-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-brand-border-light mt-2">
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className="block py-2.5 text-sm text-brand-gray hover:text-[#1C1A16]"
                    onClick={() => setMobileOpen(false)}
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left py-2.5 text-sm text-brand-gray hover:text-[#1C1A16]"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="block py-2.5 text-sm text-[#1C1A16] font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  登录 / 注册
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, ChevronDown, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { MODULES, MODULE_GROUPS } from '@/data/modules';

// 顶部主导航 + mega-menu 全部从 MODULES 唯一真源派生（与 Sidebar / 手机抽屉 / TabBar 一致）
const pick = (id: string) => MODULES.find((m) => m.id === id)!;
const featuredNav = [
  { label: '首页', href: '/' },
  ...[pick('bazi'), pick('daily'), pick('tarot')].map((m) => ({ label: m.label, href: m.href })),
];

const megaGroups = MODULE_GROUPS;
const allMegaHrefs = megaGroups.flatMap((g) => g.items.map((i) => i.href)).concat('/knowledge');

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); setMoreOpen(false); setUserMenuOpen(false); }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 路由变化时收起所有浮层
  useEffect(() => { setMoreOpen(false); setUserMenuOpen(false); }, [pathname]);

  // 点击外部关闭 mega-menu（触屏/无 hover 场景）
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [moreOpen]);

  const linkCls = (active: boolean) =>
    `text-sm transition-colors duration-200 ${active ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`;

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#1C1A16]/10 bg-white/85 backdrop-blur-md"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* 左侧：移动端汉堡 + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden min-w-[44px] min-h-[44px] p-3 -ml-2 text-brand-gray hover:text-[#1C1A16] transition-transform duration-200 active:scale-95 relative z-[10000]"
              aria-label="菜单"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 font-display text-lg md:text-xl text-[#1C1A16] tracking-widest hover:opacity-70 transition-opacity">
              <img src="/favicon.svg" alt="CyberFate 赛博命理师" className="w-7 h-7" />
              <span><span className="font-normal text-[#1C1A16]/50">CYBER</span><span className="font-bold">FATE</span></span>
            </Link>
          </div>

          {/* Desktop Nav - 中间 */}
          <div className="hidden lg:flex items-center gap-7">
            {featuredNav.map((item) => (
              <Link key={item.href} href={item.href} className={linkCls(pathname === item.href)}>
                {item.label}
              </Link>
            ))}

            {/* 全部功能 mega-menu（hover 展开；触屏可点击切换） */}
            <div
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1 ${linkCls(allMegaHrefs.includes(pathname))}`}
                aria-expanded={moreOpen}
              >
                全部功能
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3">
                  <div className="w-[760px] rounded-2xl bg-white shadow-xl border border-brand-border-light p-5 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-x-5 gap-y-1">
                      {megaGroups.map((group) => (
                        <div key={group.title}>
                          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-[#1C1A16]/40">
                            {group.title}
                          </p>
                          <div className="space-y-0.5">
                            {group.items.map((item) => {
                              const Icon = item.icon!;
                              const active = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMoreOpen(false)}
                                  className={`group flex items-start gap-3 rounded-xl p-2 transition-colors ${active ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]'}`}
                                >
                                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-accent-soft text-brand-accent">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-[#1C1A16]">{item.label}</span>
                                    <span className="block text-xs text-[#1C1A16]/50 leading-snug mt-0.5">{item.desc}</span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* 底部：知识库 + CTA */}
                    <div className="mt-4 flex items-center justify-between border-t border-brand-border-light pt-3">
                      <Link href="/knowledge" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 text-sm text-brand-gray hover:text-[#1C1A16] transition-colors">
                        <BookOpen className="h-4 w-4 text-brand-accent" />
                        命理知识库
                        <span className="text-xs text-[#1C1A16]/40">术语图解与入门科普</span>
                      </Link>
                      <Link
                        href="/bazi"
                        onClick={() => setMoreOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover transition-colors"
                      >
                        免费测八字 <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/pricing" className={linkCls(pathname === '/pricing')}>
              定价
            </Link>
          </div>

          {/* 右侧：CTA + 账户/登录 */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/bazi"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              免费测八字
            </Link>
            {session ? (
              <div
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 text-sm text-brand-gray hover:text-[#1C1A16] cursor-pointer transition-colors duration-200"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="用户头像" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-brand-bg flex items-center justify-center text-xs font-medium text-[#1C1A16]">
                      {session.user?.name?.[0] || '我'}
                    </span>
                  )}
                  个人中心
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2">
                    <div className="py-2 bg-white rounded-lg shadow-lg border border-brand-border-light min-w-[140px] animate-fadeIn">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors">
                        个人中心
                      </Link>
                      <Link href="/pricing" className="block px-4 py-2 text-sm text-brand-gray hover:text-[#1C1A16] hover:bg-brand-bg transition-colors">
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

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200 animate-fadeIn"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <div className="fixed left-0 right-0 top-16 bottom-0 z-50 lg:hidden bg-white overflow-y-auto animate-slideDown">
          <div className="px-4 py-4">
            {/* CTA */}
            <Link
              href="/bazi"
              className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-3 text-sm font-medium text-white active:bg-brand-accent-hover transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles className="h-4 w-4" /> 免费测八字
            </Link>

            {/* 高频入口 */}
            <div className="space-y-0.5">
              {featuredNav.filter(i => i.href !== '/bazi').map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center py-3 text-sm transition-colors active:bg-brand-bg ${pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* 分组功能 */}
            {megaGroups.map((group) => (
              <div key={group.title} className="pt-3 border-t border-brand-border-light mt-2">
                <p className="px-1 py-1.5 text-[11px] font-semibold tracking-wider text-[#1C1A16]/40">{group.title}</p>
                {group.items.map((item) => {
                  const Icon = item.icon!;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 py-2.5 transition-colors active:bg-brand-bg"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-accent-soft text-brand-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-[#1C1A16]">{item.label}</span>
                        <span className="block text-xs text-[#1C1A16]/45 leading-snug">{item.desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* 知识库 + 定价 */}
            <div className="pt-3 border-t border-brand-border-light mt-2 space-y-0.5">
              <Link href="/knowledge" className={`block py-3 text-sm active:bg-brand-bg transition-colors ${pathname === '/knowledge' ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`} onClick={() => setMobileOpen(false)}>
                命理知识库
              </Link>
              <Link href="/pricing" className={`block py-3 text-sm active:bg-brand-bg transition-colors ${pathname === '/pricing' ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`} onClick={() => setMobileOpen(false)}>
                定价
              </Link>
            </div>

            {/* 登录/账户 */}
            <div className="pt-2 border-t border-brand-border-light mt-2">
              {session ? (
                <>
                  <Link href="/profile" className="block py-3 text-sm text-brand-gray hover:text-[#1C1A16] active:bg-brand-bg transition-colors" onClick={() => setMobileOpen(false)}>
                    个人中心
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false); }}
                    className="block w-full text-left py-3 text-sm text-brand-gray hover:text-[#1C1A16] active:bg-brand-bg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  className="block w-full text-left py-3 text-sm text-[#1C1A16] font-medium active:bg-brand-bg transition-colors"
                  onClick={() => { setMobileOpen(false); setAuthOpen(true); }}
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

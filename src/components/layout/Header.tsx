'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu, X, ChevronDown,
  Sparkles, Star, Heart, Gem, Coins, Flower2, Sun, CalendarDays, Music, BookOpen, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

interface NavItem {
  label: string;
  href: string;
  desc?: string;
  icon?: LucideIcon;
  badge?: '热门' | 'NEW';
}

// 顶部主导航（高频入口，桌面端直接展示）
const featuredNav: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '八字分析', href: '/bazi', badge: '热门' },
  { label: '每日运势', href: '/daily' },
  { label: '塔罗占卜', href: '/tarot' },
];

// "全部功能" mega-menu 分组
const megaGroups: { title: string; items: NavItem[] }[] = [
  {
    title: '东方命理',
    items: [
      { label: '八字分析', href: '/bazi', desc: 'AI 排盘，解读命盘特质与运势', icon: Sparkles, badge: '热门' },
      { label: '紫微斗数', href: '/ziwei', desc: '十二宫位与主星格局精解', icon: Star },
      { label: '合婚配对', href: '/bazi/marriage', desc: '双方八字深度匹配度分析', icon: Heart },
    ],
  },
  {
    title: '占卜决策',
    items: [
      { label: '塔罗占卜', href: '/tarot', desc: 'AI 塔罗，多角度看清处境', icon: Gem },
      { label: '六爻占卜', href: '/liuyao', desc: '传统六爻 + AI 深度解卦', icon: Coins },
      { label: '梅花易数', href: '/meihua', desc: '随时起卦，助你做关键决策', icon: Flower2 },
    ],
  },
  {
    title: '每日开运',
    items: [
      { label: '每日运势', href: '/daily', desc: '每日吉凶与开运指引', icon: Sun },
      { label: '2026生肖运势', href: '/2026', desc: '丙午马年十二生肖全解', icon: Sparkles, badge: 'NEW' },
      { label: '黄历查询', href: '/huangli', desc: '宜忌吉日，AI 智能择日', icon: CalendarDays },
      { label: '音乐运势签', href: '/music-oracle', desc: '抽一签，听见你的运势', icon: Music },
    ],
  },
];

const allMegaHrefs = megaGroups.flatMap(g => g.items.map(i => i.href)).concat('/knowledge');

function Badge({ kind }: { kind: '热门' | 'NEW' }) {
  return (
    <span
      className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium leading-none align-middle ${
        kind === 'NEW' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#FBEEDD] text-[#C2762B]'
      }`}
    >
      {kind}
    </span>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen]);

  const linkCls = (active: boolean) =>
    `text-sm transition-colors duration-200 ${active ? 'text-[#1C1A16] font-medium' : 'text-brand-gray hover:text-[#1C1A16]'}`;

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
              CYBERFATE
            </Link>
          </div>

          {/* Desktop Nav - 中间 */}
          <div className="hidden lg:flex items-center gap-7">
            {featuredNav.map((item) => (
              <Link key={item.href} href={item.href} className={linkCls(pathname === item.href)}>
                {item.label}
                {item.badge && <Badge kind={item.badge} />}
              </Link>
            ))}

            {/* 全部功能 mega-menu */}
            <div
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
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
                                  className={`group flex items-start gap-3 rounded-xl p-2 transition-colors ${active ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]'}`}
                                >
                                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FBEEDD] text-[#C2762B]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="flex items-center text-sm font-medium text-[#1C1A16]">
                                      {item.label}
                                      {item.badge && <Badge kind={item.badge} />}
                                    </span>
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
                      <Link href="/knowledge" className="flex items-center gap-2 text-sm text-brand-gray hover:text-[#1C1A16] transition-colors">
                        <BookOpen className="h-4 w-4 text-[#C2762B]" />
                        命理知识库
                        <span className="text-xs text-[#1C1A16]/40">术语图解与入门科普</span>
                      </Link>
                      <Link
                        href="/bazi"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#C2762B] px-4 py-2 text-sm font-medium text-white hover:bg-[#A86425] transition-colors"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C2762B] px-4 py-2 text-sm font-medium text-white hover:bg-[#A86425] transition-colors"
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
                <button className="flex items-center gap-2 text-sm text-brand-gray hover:text-[#1C1A16] cursor-pointer transition-colors duration-200">
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
              className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#C2762B] px-4 py-3 text-sm font-medium text-white active:bg-[#A86425] transition-colors"
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
                  {item.badge && <Badge kind={item.badge} />}
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
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FBEEDD] text-[#C2762B]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center text-sm text-[#1C1A16]">
                          {item.label}
                          {item.badge && <Badge kind={item.badge} />}
                        </span>
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

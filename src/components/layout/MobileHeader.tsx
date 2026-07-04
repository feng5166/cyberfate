'use client';

// 手机端内页顶栏（仅 <md 显示；md+ 平板/桌面走 Sidebar，本组件隐藏）。
// 提供 返回 + Logo(回首页) + 全模块抽屉，补齐底部 TabBar 之外模块的可达性，并解 PWA 无浏览器后退键的困境。
// 导航目录从 MODULES 唯一真源派生，与 Sidebar / 首页 Header 完全一致。
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeft, Menu, X, Sparkles } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { MODULE_GROUPS, EXTRA_LINKS } from '@/data/modules';

// 顶栏高度（不含安全区）。抽屉顶部偏移与之联动，安全区叠加为“额外”内边距而非吃掉内容高度。
const BAR = '3.5rem'; // h-14
const barTopOffset = `calc(${BAR} + env(safe-area-inset-top))`;

export function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // 路由变化收起抽屉
  useEffect(() => { setOpen(false); }, [pathname]);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <>
      {/* 安全区做“额外”内边距：header 总高 = 56px + inset，内容行恒为 h-14，刘海屏不再压缩 */}
      <header
        className="md:hidden sticky top-0 z-40 border-b border-brand-ink/10 bg-white/95 backdrop-blur-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex h-14 items-center justify-between px-2">
          <button
            onClick={goBack}
            aria-label="返回"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-brand-gray active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Link href="/" aria-label="CyberFate 首页" className="flex items-center gap-1.5 font-display text-base tracking-widest text-brand-ink">
            <img src="/favicon.svg" alt="" className="h-6 w-6" />
            CYBERFATE
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="菜单"
            aria-expanded={open}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-brand-gray active:scale-95 transition-transform"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 animate-fadeIn"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <div
          className="md:hidden fixed left-0 right-0 bottom-0 z-50 overflow-y-auto bg-white animate-slideDown"
          style={{ top: barTopOffset, paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-4 py-4">
            <Link
              href="/bazi"
              onClick={() => setOpen(false)}
              className="mb-3 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-3 text-sm font-medium text-white active:bg-brand-accent-hover transition-colors"
            >
              <Sparkles className="h-4 w-4" /> 免费测八字
            </Link>

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`flex min-h-[44px] items-center py-3 text-sm transition-colors active:bg-brand-bg ${pathname === '/' ? 'text-brand-ink font-medium' : 'text-brand-gray'}`}
            >
              首页
            </Link>

            {MODULE_GROUPS.map((group) => (
              <div key={group.key} className="mt-2 border-t border-brand-border-light pt-3">
                <p className="px-1 py-1.5 text-[11px] font-semibold tracking-wider text-brand-ink/40">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center py-2.5 text-sm transition-colors active:bg-brand-bg ${pathname === item.href ? 'text-brand-ink font-medium' : 'text-brand-gray'}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="mt-2 space-y-0.5 border-t border-brand-border-light pt-3">
              {EXTRA_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[44px] items-center py-3 text-sm transition-colors active:bg-brand-bg ${pathname === item.href ? 'text-brand-ink font-medium' : 'text-brand-gray'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-2 border-t border-brand-border-light pt-2">
              {session ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="flex min-h-[44px] items-center py-3 text-sm text-brand-gray active:bg-brand-bg transition-colors">
                    个人中心
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
                    className="flex min-h-[44px] w-full items-center py-3 text-left text-sm text-brand-gray active:bg-brand-bg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setOpen(false); setAuthOpen(true); }}
                  className="flex min-h-[44px] w-full items-center py-3 text-left text-sm font-medium text-brand-ink active:bg-brand-bg transition-colors"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

'use client';

// 手机端内页顶栏（仅 <md 显示；md+ 平板/桌面走 Sidebar，本组件隐藏）。
// 补齐两个真实缺口：①底部 5 个 tab 之外的模块(紫微/六爻/梅花/合婚/音乐签/知识库)无处可达
// ②PWA standalone 无浏览器后退键 → 深层页面被困。故提供 返回 + Logo(回首页) + 全模块抽屉。
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeft, Menu, X, Sparkles } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

const GROUPS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: '东方命理',
    items: [
      { label: '八字分析', href: '/bazi' },
      { label: '紫微斗数', href: '/ziwei' },
      { label: '合婚配对', href: '/bazi/marriage' },
    ],
  },
  {
    title: '占卜决策',
    items: [
      { label: '塔罗占卜', href: '/tarot' },
      { label: '六爻占卜', href: '/liuyao' },
      { label: '梅花易数', href: '/meihua' },
    ],
  },
  {
    title: '每日开运',
    items: [
      { label: '每日运势', href: '/daily' },
      { label: '2026生肖运势', href: '/2026' },
      { label: '黄历查询', href: '/huangli' },
      { label: '音乐运势签', href: '/music-oracle' },
    ],
  },
];

const EXTRA = [
  { label: '命理知识库', href: '/knowledge' },
  { label: '定价', href: '/pricing' },
];

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
      <header
        className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#1C1A16]/10 bg-white/95 px-2 backdrop-blur-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={goBack}
          aria-label="返回"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-brand-gray active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <Link href="/" aria-label="CyberFate 首页" className="flex items-center gap-1.5 font-display text-base tracking-widest text-[#1C1A16]">
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
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 animate-fadeIn"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <div className="md:hidden fixed left-0 right-0 top-14 bottom-0 z-50 overflow-y-auto bg-white animate-slideDown"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-4 py-4">
            <Link
              href="/bazi"
              onClick={() => setOpen(false)}
              className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#C2762B] px-4 py-3 text-sm font-medium text-white active:bg-[#A86425] transition-colors"
            >
              <Sparkles className="h-4 w-4" /> 免费测八字
            </Link>

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`flex py-3 text-sm transition-colors active:bg-brand-bg ${pathname === '/' ? 'text-[#1C1A16] font-medium' : 'text-brand-gray'}`}
            >
              首页
            </Link>

            {GROUPS.map((group) => (
              <div key={group.title} className="mt-2 border-t border-brand-border-light pt-3">
                <p className="px-1 py-1.5 text-[11px] font-semibold tracking-wider text-[#1C1A16]/40">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block py-2.5 text-sm transition-colors active:bg-brand-bg ${pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray'}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="mt-2 space-y-0.5 border-t border-brand-border-light pt-3">
              {EXTRA.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 text-sm transition-colors active:bg-brand-bg ${pathname === item.href ? 'text-[#1C1A16] font-medium' : 'text-brand-gray'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-2 border-t border-brand-border-light pt-2">
              {session ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="block py-3 text-sm text-brand-gray active:bg-brand-bg transition-colors">
                    个人中心
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
                    className="block w-full py-3 text-left text-sm text-brand-gray active:bg-brand-bg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setOpen(false); setAuthOpen(true); }}
                  className="block w-full py-3 text-left text-sm font-medium text-[#1C1A16] active:bg-brand-bg transition-colors"
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

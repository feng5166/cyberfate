'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, X } from 'lucide-react';
import { MODULES, MODULE_GROUPS, EXTRA_LINKS, moduleByPath } from '@/data/modules';

// 底部 tab 从 MODULES 唯一真源取高频模块；“更多”打开全模块 bottom-sheet，覆盖所有非高频路由。
const pick = (id: string) => MODULES.find((m) => m.id === id)!;
const TAB_MODULES = [pick('bazi'), pick('daily'), pick('tarot')];

export function TabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [moreOpen]);

  const onHome = pathname === '/';
  const isTabActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const anyTabActive = onHome || TAB_MODULES.some((m) => isTabActive(m.href));
  const moreActive = !anyTabActive; // 任何非首页/非高频模块路由 → 高亮“更多”

  const activeId = moduleByPath(pathname)?.id;

  const itemCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-200 active:scale-95 ${
      active ? 'text-brand-accent' : 'text-brand-gray'
    }`;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-brand-border-light"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16">
          <Link href="/" className={itemCls(onHome)}>
            <Home className="w-5 h-5" strokeWidth={onHome ? 2.5 : 2} />
            <span className={`text-xs ${onHome ? 'font-medium' : 'font-normal'}`}>首页</span>
          </Link>

          {TAB_MODULES.map((m) => {
            const active = isTabActive(m.href);
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} className={itemCls(active)}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-xs ${active ? 'font-medium' : 'font-normal'}`}>{m.short}</span>
              </Link>
            );
          })}

          <button type="button" onClick={() => setMoreOpen(true)} className={itemCls(moreActive)} aria-label="更多功能" aria-expanded={moreOpen}>
            <Grid3x3 className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 2} />
            <span className={`text-xs ${moreActive ? 'font-medium' : 'font-normal'}`}>更多</span>
          </button>
        </div>
      </nav>

      {/* 全模块 bottom-sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="全部功能">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div
            className="absolute left-0 right-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-brand-border-light bg-white px-4 py-3">
              <span className="font-display text-base tracking-wide text-brand-ink">全部功能</span>
              <button onClick={() => setMoreOpen(false)} aria-label="关闭" className="flex h-9 w-9 items-center justify-center rounded-full text-brand-gray active:bg-brand-border-light">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3">
              {MODULE_GROUPS.map((group) => (
                <div key={group.key} className="mb-4">
                  <p className="mb-1 px-1 text-[11px] font-semibold tracking-wider text-brand-ink/40">{group.title}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((m) => {
                      const Icon = m.icon;
                      const active = activeId === m.id;
                      return (
                        <Link
                          key={m.href}
                          href={m.href}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                            active ? 'border-brand-accent bg-brand-accent-tint' : 'border-brand-border-light bg-white active:bg-brand-bg'
                          }`}
                        >
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-brand-accent text-white' : 'bg-brand-accent-soft text-brand-accent'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs text-brand-ink">{m.short}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 border-t border-brand-border-light pt-3">
                {EXTRA_LINKS.map((m) => (
                  <Link key={m.href} href={m.href} className="flex-1 rounded-xl border border-brand-border-light py-2.5 text-center text-sm text-brand-gray active:bg-brand-bg">
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

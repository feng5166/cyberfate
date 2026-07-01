'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Sun, Layers, Grid3x3 } from 'lucide-react';

const tabs = [
  { label: '首页', icon: Home, href: '/' },
  { label: '八字', icon: BarChart3, href: '/bazi' },
  { label: '运势', icon: Sun, href: '/daily' },
  { label: '塔罗', icon: Layers, href: '/tarot' },
  { label: '更多', icon: Grid3x3, href: '/knowledge' },
];

export function TabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-brand-border-light"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-200 active:scale-95 ${
                active ? 'text-[#1C1A16]' : 'text-brand-gray'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1C1A16]" />
                )}
              </div>
              <span className={`text-xs ${active ? 'font-medium' : 'font-normal'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

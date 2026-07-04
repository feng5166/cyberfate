'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { DashboardLayout } from './DashboardLayout';
import { Footer } from './Footer';
import { AuthProvider } from '@/stores/authStore';

// 非首屏的纯客户端 chrome：移动底栏 / 回到顶部，首屏不需要，懒加载以减小首屏 JS（不影响 SEO）
const BackToTop = dynamic(() => import('../BackToTop').then(m => m.BackToTop), { ssr: false });
const TabBar = dynamic(() => import('../TabBar').then(m => m.TabBar), { ssr: false });

interface LayoutWrapperProps {
  children: ReactNode;
}

function SidebarController({ onExpand }: { onExpand: () => void }) {
  const searchParams = useSearchParams();
  const currentPath = usePathname();

  // Only run on first render with searchParams
  if (searchParams.get('sidebar') === 'open') {
    onExpand();
    // Clean URL without re-render
    window.history.replaceState({}, '', currentPath);
  }

  return null;
}

function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('payment_success') !== 'true') return;

    console.log('[PaymentSuccessHandler] payment_success=true detected, pathname:', pathname);
    console.log('[PaymentSuccessHandler] >>> router.refresh() 前');
    window.history.replaceState({}, '', pathname);
    router.refresh();
    console.log('[PaymentSuccessHandler] <<< router.refresh() 后');
  }, [searchParams, router, pathname]);

  return null;
}

// 营销/法务/登录/生肖/支付类页面走“首页外壳”（顶部 Header + Footer，无模块侧栏/底栏），
// 与模块 app 页面（侧栏 / MobileHeader+TabBar）区分开。首页也归此类，与营销页同壳。
const MARKETING_PREFIXES = ['/about', '/pricing', '/privacy', '/terms', '/refund', '/2026', '/auth', '/reset-password', '/payment'];
function isMarketingRoute(p: string): boolean {
  return MARKETING_PREFIXES.some((pre) => p === pre || p.startsWith(pre + '/'));
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  // app 外壳：非首页、且非营销/法务/登录类路由 → 模块页
  const useAppChrome = !isHomePage && !isMarketingRoute(pathname);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 首页 + 营销/法务/登录页：站点级顶栏 */}
      {!useAppChrome && <Header />}
      {useAppChrome && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="fixed top-3 z-50 hidden h-9 w-9 items-center justify-center rounded-lg border border-brand-ink/[0.08] bg-brand-bg transition-all duration-300 hover:bg-brand-border-light cursor-pointer md:flex"
          style={{ left: (isSidebarCollapsed ? 0 : 220) + 12 }}
          title={isSidebarCollapsed ? '展开导航' : '收起导航'}
          aria-label={isSidebarCollapsed ? '展开导航' : '收起导航'}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 text-brand-gray" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-brand-gray" />
          )}
        </button>
      )}
      <main
        id="main-content"
        className={`flex-1 ${useAppChrome ? 'pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-0' : ''}`}
      >
        {/* 仅把用 useSearchParams 的处理器各自包进独立 Suspense，
            避免把 {children}(页面内容) 一起 bailout 到 CSR —— 保证首页等可 SSG/SSR */}
        <Suspense fallback={null}>
          <PaymentSuccessHandler />
        </Suspense>
        {/* 手机端内页顶栏（返回+Logo+全模块抽屉）；md+ 走 Sidebar，MobileHeader 自身 md:hidden */}
        {useAppChrome && <MobileHeader />}
        {useAppChrome ? (
          <DashboardLayout
            collapsed={isSidebarCollapsed}
            onCollapseToggle={(next) => setSidebarCollapsed(next)}
            showSidebar={useAppChrome}
          >
            <Suspense fallback={null}>
              <SidebarController onExpand={() => setSidebarCollapsed(false)} />
            </Suspense>
            {children}
          </DashboardLayout>
        ) : (
          <>{children}<Footer /></>
        )}
      </main>
      {/* 底部 chrome 仅模块页出现，避免营销/法务页出现命理模块底栏 */}
      {useAppChrome && (
        <>
          <BackToTop />
          <TabBar />
        </>
      )}
    </div>
  );
}

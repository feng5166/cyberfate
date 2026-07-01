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

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const showSidebar = !isHomePage;
  const layoutClasses = 'flex flex-col min-h-dvh';

  return (
    <div className={layoutClasses}>
      {/* Header 在正常文档流中，随内容一起滚动（不再固定吸顶） */}
      {!showSidebar && <Header />}
      {showSidebar && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="fixed top-3 z-50 hidden h-9 w-9 items-center justify-center rounded-lg border border-[#1C1A16]/[0.08] bg-[#FAF9F6] transition-all duration-300 hover:bg-gray-100 cursor-pointer md:flex"
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
      <main id="main-content" className="flex-1 pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-0" style={{ paddingTop: 0 }}>
        {/* 仅把用 useSearchParams 的处理器各自包进独立 Suspense，
            避免把 {children}(页面内容) 一起 bailout 到 CSR —— 保证首页等可 SSG/SSR */}
        <Suspense fallback={null}>
          <PaymentSuccessHandler />
        </Suspense>
        {/* 手机端内页顶栏（返回+Logo+全模块抽屉）；md+ 走 Sidebar，MobileHeader 自身 md:hidden */}
        {showSidebar && <MobileHeader />}
        {showSidebar ? (
          <DashboardLayout
            collapsed={isSidebarCollapsed}
            onCollapseToggle={(next) => setSidebarCollapsed(next)}
            showSidebar={showSidebar}
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
      <BackToTop />
      <TabBar />
    </div>
  );
}

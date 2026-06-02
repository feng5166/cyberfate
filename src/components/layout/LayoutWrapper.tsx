'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Header } from './Header';
import { DashboardLayout } from './DashboardLayout';
import { Footer } from './Footer';
import { BackToTop } from '../BackToTop';
import { TabBar } from '../TabBar';
import { AuthProvider } from '@/stores/authStore';

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
  const layoutClasses = 'flex flex-col min-h-screen';

  return (
    <div className={layoutClasses}>
      {/* 固定定位包裹层 - 确保Header始终在顶部 */}
      {!showSidebar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <Header />
        </div>
      )}
      {showSidebar && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="fixed top-3 z-50 hidden h-9 w-9 items-center justify-center rounded-lg border border-[#1C1A16]/[0.08] bg-[#FAF9F6] transition-all duration-300 hover:bg-gray-100 cursor-pointer lg:flex"
          style={{ left: isSidebarCollapsed ? 64 : 260, transform: 'translateX(-50%)' }}
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
      <main id="main-content" className="flex-1 pb-20 lg:pb-0" style={{ paddingTop: showSidebar ? 0 : '80px' }}>
        <Suspense fallback={null}>
          <PaymentSuccessHandler />
          {showSidebar ? (
            <DashboardLayout
              collapsed={isSidebarCollapsed}
              onCollapseToggle={(next) => setSidebarCollapsed(next)}
              showSidebar={showSidebar}
            >
              <SidebarController onExpand={() => setSidebarCollapsed(false)} />
              {children}
            </DashboardLayout>
          ) : (
            <>{children}<Footer /></>
          )}
        </Suspense>
      </main>
      <BackToTop />
      <TabBar />
    </div>
  );
}

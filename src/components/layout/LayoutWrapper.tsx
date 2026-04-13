'use client';

import { useState, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const showSidebar = !isHomePage;
  const layoutClasses = 'flex flex-col min-h-screen';

  return (
    <div className={layoutClasses}>
      {/* 固定定位包裹层 - 确保Header始终在顶部 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <Header />
      </div>
      <main className="flex-1 pb-20 lg:pb-0" style={{ paddingTop: '80px' }}>
        <Suspense fallback={null}>
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

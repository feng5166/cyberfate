'use client';

import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { DashboardLayout } from './DashboardLayout';
import { Footer } from './Footer';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // 首页不显示侧边栏
  const isHomePage = pathname === '/';
  const showSidebar = Boolean(session) && !isHomePage;
  const layoutClasses = 'flex flex-col min-h-screen';

  const handleWorkbenchClick = () => {
    if (!showSidebar) return;
    setSidebarCollapsed(false);
    if (typeof window !== 'undefined') {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      if (!isDesktop) {
        setMobileMenuOpen(true);
      }
    }
  };

  return (
    <div className={layoutClasses}>
      {/* 固定定位包裹层 - 确保Header始终在顶部 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <Header 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          showMobileMenu={showSidebar || false}
          onWorkbenchClick={handleWorkbenchClick}
          showWorkbench={!!showSidebar}
        />
      </div>
      <main className="flex-1" style={{ paddingTop: '80px' }}>
        {showSidebar ? (
          <DashboardLayout
            collapsed={isSidebarCollapsed}
            onCollapseToggle={(next) => setSidebarCollapsed(next)}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
            showSidebar={showSidebar}
          >
            {children}
          </DashboardLayout>
        ) : (
          <>{children}<Footer /></>
        )}
      </main>
    </div>
  );
}

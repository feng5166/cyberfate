'use client';

import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { DashboardLayout } from './DashboardLayout';
import { Footer } from './Footer';
import { BackToTop } from '../BackToTop';
import { TabBar } from '../TabBar';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // 首页不显示侧边栏
  const isHomePage = pathname === '/';
  const showSidebar = Boolean(session) && !isHomePage;
  const layoutClasses = 'flex flex-col min-h-screen';

  return (
    <div className={layoutClasses}>
      {/* 固定定位包裹层 - 确保Header始终在顶部 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <Header />
      </div>
      <main className="flex-1 pb-20 lg:pb-0" style={{ paddingTop: '80px' }}>
        {showSidebar ? (
          <DashboardLayout
            collapsed={isSidebarCollapsed}
            onCollapseToggle={(next) => setSidebarCollapsed(next)}
            showSidebar={showSidebar}
          >
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

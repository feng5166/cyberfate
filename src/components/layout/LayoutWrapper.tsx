'use client';

import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { DashboardLayout } from './DashboardLayout';

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
      <Header 
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
        showMobileMenu={showSidebar || false}
        onWorkbenchClick={handleWorkbenchClick}
        showWorkbench={!!showSidebar}
      />
      <main className="flex-1 pt-16 md:pt-18">
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
          children
        )}
      </main>
      <Footer />
    </div>
  );
}

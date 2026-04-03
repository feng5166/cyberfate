'use client';

import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

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
  const layoutClasses = [
    'flex flex-col min-h-screen',
    showSidebar ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[260px]') : '',
  ]
    .filter(Boolean)
    .join(' ');

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
    <>
      {/* 首页不显示侧边栏，其他页面登录后显示 */}
      {showSidebar && (
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onMobileClose={() => setMobileMenuOpen(false)} 
          collapsed={isSidebarCollapsed}
          onCollapseToggle={(next) => setSidebarCollapsed(next)}
        />
      )}
      {/* 桌面端：有侧边栏时留出空间 */}
      <div className={layoutClasses}>
        <Header 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          showMobileMenu={showSidebar || false}
          onWorkbenchClick={handleWorkbenchClick}
          showWorkbench={!!showSidebar}
        />
        <main className="flex-1 pt-16 md:pt-18">{children}</main>
        <Footer />
      </div>
    </>
  );
}

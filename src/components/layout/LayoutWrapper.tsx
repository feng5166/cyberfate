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
  const { data: session } = useSession();
  const pathname = usePathname();

  // 首页不显示侧边栏
  const isHomePage = pathname === '/';
  const showSidebar = session && !isHomePage;

  return (
    <>
      {/* 首页不显示侧边栏，其他页面登录后显示 */}
      {showSidebar && (
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onMobileClose={() => setMobileMenuOpen(false)} 
        />
      )}
      {/* 桌面端：有侧边栏时留出空间 */}
      <div className={showSidebar ? "lg:ml-60 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
        <Header 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          showMobileMenu={showSidebar || false} 
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}

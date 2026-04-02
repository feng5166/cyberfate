'use client';

import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      {/* 只在登录态显示侧边栏 */}
      {session && (
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onMobileClose={() => setMobileMenuOpen(false)} 
        />
      )}
      {/* 桌面端：登录时为侧边栏留出空间 */}
      <div className={session ? "lg:ml-60 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}

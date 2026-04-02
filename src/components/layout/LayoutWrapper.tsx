'use client';

import { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />
      {/* 桌面端：为侧边栏留出空间 */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}

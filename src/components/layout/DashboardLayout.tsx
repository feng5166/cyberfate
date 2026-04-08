'use client';

import { ReactNode, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  collapsed?: boolean;
  onCollapseToggle?: (next: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  showSidebar?: boolean;
}

export function DashboardLayout({
  children,
  collapsed: collapsedProp,
  onCollapseToggle,
  mobileOpen = false,
  onMobileClose,
  showSidebar,
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const resolvedShowSidebar =
    typeof showSidebar === 'boolean'
      ? showSidebar
      : Boolean(session) && pathname !== '/';

  const collapsed = collapsedProp ?? internalCollapsed;

  const handleCollapseToggle = (next?: boolean) => {
    const nextState = typeof next === 'boolean' ? next : !collapsed;
    if (collapsedProp === undefined) {
      setInternalCollapsed(nextState);
    }
    onCollapseToggle?.(nextState);
  };

  const sidebarWidth = collapsed ? 64 : 260;

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {resolvedShowSidebar && (
        <Sidebar
          collapsed={collapsed}
          onCollapseToggle={handleCollapseToggle}
          mobileOpen={mobileOpen}
          onMobileClose={onMobileClose}
        />
      )}
      <main
        style={{
          marginLeft: resolvedShowSidebar ? sidebarWidth : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 64px)',
          width: resolvedShowSidebar ? `calc(100% - ${sidebarWidth}px)` : '100%',
        }}
        className="bg-brand-bg"
      >
        {children}
      </main>
    </div>
  );
}

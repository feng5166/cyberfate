'use client';

import { ReactNode, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  collapsed?: boolean;
  onCollapseToggle?: (next: boolean) => void;
  showSidebar?: boolean;
}

export function DashboardLayout({
  children,
  collapsed: collapsedProp,
  onCollapseToggle,
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

  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <div className="min-h-dvh">
      {resolvedShowSidebar && (
        <Sidebar
          collapsed={collapsed}
          onCollapseToggle={handleCollapseToggle}
        />
      )}
      <main
        className="bg-brand-bg transition-all duration-300 ease md:ml-[var(--sidebar-width)] md:w-[calc(100%-var(--sidebar-width))]"
        style={{
          '--sidebar-width': resolvedShowSidebar ? `${sidebarWidth}px` : '0px',
          minHeight: '100dvh',
        } as React.CSSProperties}
      >
        {children}
      </main>
    </div>
  );
}

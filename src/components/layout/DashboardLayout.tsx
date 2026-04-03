'use client';

import { ReactNode, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
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

  const contentClasses = clsx(
    'min-h-[calc(100vh-64px)] bg-brand-bg transition-all duration-300 ease',
    resolvedShowSidebar
      ? collapsed
        ? 'lg:ml-16'
        : 'lg:ml-[260px]'
      : 'ml-0'
  );

  return (
    <div className="relative">
      {resolvedShowSidebar && (
        <Sidebar
          collapsed={collapsed}
          onCollapseToggle={handleCollapseToggle}
          mobileOpen={mobileOpen}
          onMobileClose={onMobileClose}
        />
      )}
      <div className={contentClasses}>{children}</div>
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface SidebarGroupProps {
  title?: string;
  children: ReactNode;
  collapsed?: boolean;
  showDivider?: boolean;
  className?: string;
}

export function SidebarGroup({
  title,
  children,
  collapsed = false,
  showDivider = false,
  className,
}: SidebarGroupProps) {
  return (
    <div className={clsx('w-full', className)}>
      {showDivider && (
        <div className="mx-5 mt-6 mb-3 border-t border-brand-border-light" aria-hidden />
      )}
      {title && !collapsed && (
        <div className="px-5 mt-5 mb-2 text-[13px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1 px-1">{children}</div>
    </div>
  );
}

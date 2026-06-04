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
        <div className="mx-5 mt-4 mb-2 border-t border-[#1C1A16]/[0.06]" aria-hidden />
      )}
      {title && !collapsed && (
        <div className="px-4 mt-5 mb-1 text-[11px] font-medium tracking-widest text-[#B5AFA8] uppercase">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1 px-1">{children}</div>
    </div>
  );
}

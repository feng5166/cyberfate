'use client';

import Link from 'next/link';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onSelect?: () => void;
}

export function SidebarMenuItem({
  icon: Icon,
  label,
  href,
  active = false,
  collapsed = false,
  onSelect,
}: SidebarMenuItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="block"
      title={collapsed ? label : undefined}
      prefetch
      onClick={onSelect}
    >
      <span
        className={clsx(
          'relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors duration-200 ease-out',
          collapsed ? 'justify-center px-0 py-2.5' : 'px-5 py-2.5',
          active
            ? 'text-black bg-[#F9FAFB]'
            : 'text-[#6B7280] hover:text-black hover:bg-[#F9FAFB]'
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#7C3AED]"
            aria-hidden
          />
        )}
        <Icon className="h-[20px] w-[20px]" />
        {!collapsed && <span className="truncate">{label}</span>}
      </span>
    </Link>
  );
}

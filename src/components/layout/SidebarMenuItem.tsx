'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Lock as LockIcon, type LucideIcon } from 'lucide-react';

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  locked?: boolean;
  onSelect?: () => void;
}

export function SidebarMenuItem({
  icon: Icon,
  label,
  href,
  active = false,
  collapsed = false,
  locked = false,
  onSelect,
}: SidebarMenuItemProps) {
  const content = (
    <span
      className={clsx(
        'relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors duration-200 ease-out',
        collapsed ? 'justify-center px-0 py-3' : 'px-5 py-3',
        locked
          ? 'opacity-60 cursor-not-allowed text-[#6B7280]'
          : active
            ? 'text-black bg-[#FDF6EC]'
            : 'text-[#6B7280] hover:text-black hover:bg-[#F9FAFB]'
      )}
    >
      {active && !locked && (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#C2762B]"
          aria-hidden
        />
      )}
      <Icon className="h-[20px] w-[20px]" />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {locked && <LockIcon className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />}
        </>
      )}
    </span>
  );

  if (locked) {
    return (
      <div className="block" title={collapsed ? `${label}（升级会员解锁）` : '升级会员解锁此功能'}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="block"
      title={collapsed ? label : undefined}
      prefetch
      onClick={onSelect}
    >
      {content}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Permission, Role } from '@openregistro/core';
import { hasPermission } from '@openregistro/core';
import { cn } from '@openregistro/ui';

interface NavItem {
  href: string;
  label: string;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', permission: 'register:read' },
  { href: '/dashboard/school', label: 'School', permission: 'records:manage' },
  { href: '/dashboard/register', label: 'Register', permission: 'register:write' },
  { href: '/dashboard/gradebook', label: 'Gradebook', permission: 'grades:write' },
  { href: '/dashboard/grades', label: 'Grades', permission: 'grades:read' },
  { href: '/dashboard/attendance', label: 'Attendance', permission: 'attendance:read' },
  { href: '/dashboard/timetable', label: 'Timetable', permission: 'calendar:read' },
  { href: '/dashboard/announcements', label: 'Announcements', permission: 'announcements:read' },
  { href: '/dashboard/report-cards', label: 'Report cards', permission: 'reports:read' },
  { href: '/dashboard/audit-log', label: 'Audit log', permission: 'audit:read' },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-6" aria-label="Main">
      {items.map((item) => {
        const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

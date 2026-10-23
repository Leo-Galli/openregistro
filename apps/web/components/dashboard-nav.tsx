'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@openregistro/core';
import { hasPermission } from '@openregistro/core';
import { cn } from '@openregistro/ui';
import { NAV_ITEMS } from '@/lib/nav-items';

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-6"
      aria-label="Main"
    >
      {items.map((item) => {
        const active =
          item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@openregistro/ui';

const TABS = [
  { href: '/dashboard/school/classes', label: 'Classes' },
  { href: '/dashboard/school/subjects', label: 'Subjects' },
  { href: '/dashboard/school/people', label: 'People' },
];

export function SchoolTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b border-border">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(tab.href)
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

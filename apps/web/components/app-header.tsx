import Link from 'next/link';
import { Avatar, AvatarFallback, Button } from '@openregistro/ui';
import { logOut } from '@/app/dashboard/actions';

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School admin',
  secretary: 'Secretary office',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  guardian: 'Guardian',
};

export function AppHeader({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <p className="font-display text-lg font-semibold">OpenRegistro</p>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/account" className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <form action={logOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

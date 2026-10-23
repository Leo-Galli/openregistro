'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Input, Label } from '@openregistro/ui';

export function DatePicker({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="register-date" className="text-sm text-muted-foreground">
        Date
      </Label>
      <Input
        id="register-date"
        type="date"
        value={date}
        onChange={(event) => router.push(`${pathname}?date=${event.target.value}`)}
        className="w-40"
      />
    </div>
  );
}

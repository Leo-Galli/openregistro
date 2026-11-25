import { gradeTone } from '@openregistro/core';
import { Badge, type BadgeProps, cn } from '@openregistro/ui';

export interface GradeValueProps extends Omit<BadgeProps, 'variant' | 'children'> {
  value: number | null | undefined;
  /** Digits after the decimal; omit for raw integers (e.g. individual grades). */
  digits?: number;
  empty?: string;
}

/**
 * Colored grade chip for the 0-10 scale: green >= 8, amber >= 6, red below.
 */
export function GradeValue({ value, digits, empty = '-', className, ...props }: GradeValueProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <Badge variant="secondary" className={cn('tabular-nums', className)} {...props}>
        {empty}
      </Badge>
    );
  }

  const label = digits === undefined ? String(value) : value.toFixed(digits);

  return (
    <Badge
      variant={gradeTone(value)}
      className={cn('font-bold tabular-nums', className)}
      {...props}
    >
      {label}
    </Badge>
  );
}

import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const iconBadgeVariants = cva(
  'inline-flex shrink-0 items-center justify-center border-2 border-ink bg-primary-300 text-ink',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
        xl: 'h-12 w-12',
      },
      shape: {
        square: 'rounded-xl',
        rounded: 'rounded-lg',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'lg',
      shape: 'square',
    },
  },
);

export interface IconBadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof iconBadgeVariants> {}

/** The sticker-style icon/number chip used throughout the dashboard and marketing site. */
export function IconBadge({ className, size, shape, ...props }: IconBadgeProps) {
  return <span className={cn(iconBadgeVariants({ size, shape }), className)} {...props} />;
}

'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const stickerBadgeVariants = cva(
  'inline-flex select-none items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-hard-sm',
  {
    variants: {
      tone: {
        yellow: 'bg-primary-500',
        blue: 'bg-blue-300',
        pink: 'bg-pink-400',
      },
    },
    defaultVariants: {
      tone: 'yellow',
    },
  },
);

export interface StickerBadgeProps extends VariantProps<typeof stickerBadgeVariants> {
  children: ReactNode;
  className?: string;
  /** Resting tilt angle in degrees, e.g. -8 or 10. */
  rotate?: number;
  /** Delay (seconds) before the drop-in entrance plays. */
  delay?: number;
}

export function StickerBadge({
  children,
  className,
  tone,
  rotate = -8,
  delay = 0.6,
}: StickerBadgeProps) {
  return (
    <motion.span
      className={cn(stickerBadgeVariants({ tone }), className)}
      initial={{ opacity: 0, y: -30, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate }}
      whileHover={{ rotate: [rotate, rotate - 6, rotate + 6, rotate] }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 16,
        delay,
        rotate: { duration: 0.5, ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.span>
  );
}

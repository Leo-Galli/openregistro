import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const pressable =
  'border-2 border-border shadow-hard transition-[transform,box-shadow] duration-[120ms] ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg ' +
  'active:translate-x-1 active:translate-y-1 active:shadow-hard-none';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        primary: cn('bg-primary text-primary-foreground', pressable),
        secondary: cn('bg-blue-500 text-cream', pressable),
        outline: cn('bg-surface text-foreground', pressable),
        ghost: 'rounded-lg bg-transparent transition-colors hover:bg-muted',
        destructive: cn('bg-destructive text-destructive-foreground', pressable),
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

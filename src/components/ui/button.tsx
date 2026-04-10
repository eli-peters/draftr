'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-3xl border border-transparent bg-clip-padding font-bold whitespace-nowrap transition-[transform,background-color,border-color,box-shadow] duration-160 ease-out outline-none select-none focus-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 invalid-ring [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-action-primary-hover active:bg-action-primary-active',
        outline:
          'border-accent-primary-muted bg-accent-primary-subtle text-primary hover:bg-chip-primary-hover-bg hover:border-action-primary-hover hover:text-action-primary-hover aria-expanded:bg-chip-primary-hover-bg aria-expanded:border-action-primary-hover aria-expanded:text-action-primary-hover',
        secondary:
          'border-action-primary bg-accent-primary-subtle text-action-primary hover:bg-chip-primary-hover-bg hover:border-action-primary-hover hover:text-action-primary-hover aria-expanded:bg-chip-primary-hover-bg aria-expanded:border-action-primary-hover aria-expanded:text-action-primary-hover',
        ghost: 'text-primary hover:bg-accent-primary-subtle aria-expanded:bg-accent-primary-subtle',
        muted: 'text-muted-foreground hover:text-foreground aria-expanded:text-foreground',
        destructive:
          'border-action-danger bg-background text-action-danger hover:bg-feedback-error-bg hover:border-action-danger-hover hover:text-action-danger-hover aria-expanded:bg-feedback-error-bg aria-expanded:border-action-danger-hover aria-expanded:text-action-danger-hover',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-10 gap-1.5 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-7 gap-1 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-4 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-10 active:scale-90',
        'icon-sm': 'size-8 active:scale-90',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

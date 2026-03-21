import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full font-medium whitespace-nowrap has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20',
        warning:
          'bg-warning/10 text-warning border-warning/50 focus-visible:ring-warning/20 [a]:hover:bg-warning/20',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        'pace-social': 'bg-badge-pace-social-bg text-badge-pace-social-text',
        'pace-intermediate': 'bg-badge-pace-intermediate-bg text-badge-pace-intermediate-text',
        'pace-advanced': 'bg-badge-pace-advanced-bg text-badge-pace-advanced-text',
        'pace-elite': 'bg-badge-pace-elite-bg text-badge-pace-elite-text',
        'status-cancelled': 'bg-badge-status-cancelled-bg text-badge-status-cancelled-text',
        'status-full': 'bg-badge-status-full-bg text-badge-status-full-text',
        'status-confirmed': 'bg-badge-status-confirmed-bg text-badge-status-confirmed-text',
        'status-paused': 'bg-badge-status-paused-bg text-badge-status-paused-text',
        'role-leader': 'bg-badge-role-leader-bg text-badge-role-leader-text',
        'role-admin': 'bg-badge-role-admin-bg text-badge-role-admin-text',
        'role-new': 'bg-badge-role-new-bg text-badge-role-new-text',
        vibe: 'bg-badge-vibe-bg text-badge-vibe-text',
        count: 'bg-badge-count-bg text-badge-count-text',
      },
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-md',
        subtle: 'rounded',
      },
      size: {
        default: 'h-[1.375rem] px-2.5 py-0.5 text-xs',
        sm: 'h-5 min-w-5 px-1.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'pill',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'default',
  shape = 'pill',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant, size, shape }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };

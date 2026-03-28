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
        'pace-1':
          'border border-badge-pace-1-border bg-badge-pace-1-bg text-foreground font-semibold',
        'pace-2':
          'border border-badge-pace-2-border bg-badge-pace-2-bg text-foreground font-semibold',
        'pace-3':
          'border border-badge-pace-3-border bg-badge-pace-3-bg text-foreground font-semibold',
        'pace-4':
          'border border-badge-pace-4-border bg-badge-pace-4-bg text-foreground font-semibold',
        'pace-5':
          'border border-badge-pace-5-border bg-badge-pace-5-bg text-foreground font-semibold',
        'pace-6':
          'border border-badge-pace-6-border bg-badge-pace-6-bg text-foreground font-semibold',
        'status-cancelled': 'bg-badge-status-cancelled-bg text-badge-status-cancelled-text',
        'status-full': 'bg-badge-status-full-bg text-badge-status-full-text',
        'status-confirmed': 'bg-badge-status-confirmed-bg text-badge-status-confirmed-text',
        'status-paused': 'bg-badge-status-paused-bg text-badge-status-paused-text',
        'role-leader': 'bg-badge-role-leader-bg text-badge-role-leader-text',
        'role-admin': 'bg-badge-role-admin-bg text-badge-role-admin-text',
        'role-new': 'bg-badge-role-new-bg text-badge-role-new-text',
        count: 'bg-badge-count-bg text-badge-count-text',
      },
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-md',
        subtle: 'rounded',
      },
      size: {
        default: 'px-3 py-1 text-xs',
        sm: 'min-w-5 px-3 py-1.5 text-xs',
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

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export { Badge, badgeVariants };
export type { BadgeVariant };

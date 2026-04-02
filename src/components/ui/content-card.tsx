import * as React from 'react';

import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────────────────
 * ContentCard — canonical content container for non-ride content.
 *
 * Variants control visual treatment:
 *   outlined  — border, no shadow (default)
 *   elevated  — shadow, no border
 *   flat      — no border, no shadow (blends with page)
 *
 * Padding presets:
 *   compact   — p-3 md:p-4
 *   default   — p-4 md:p-5
 *   spacious  — p-5 md:p-6
 *   none      — no padding (for custom internal layout)
 *
 * Interactive adds hover/press micro-interactions for clickable cards.
 * ──────────────────────────────────────────────────────────────────────── */

const variantStyles = {
  outlined: 'border-(length:--card-border-width) border-border bg-card shadow-(--card-shadow)',
  elevated: 'bg-card shadow-sm',
  flat: 'bg-card',
} as const;

const paddingStyles = {
  compact: 'p-(--card-padding) md:p-(--card-padding-md)',
  default: 'p-(--card-padding-md) md:p-5',
  spacious: 'p-5 md:p-6',
  none: '',
} as const;

type ContentCardVariant = keyof typeof variantStyles;
type ContentCardPadding = keyof typeof paddingStyles;

interface ContentCardProps extends React.ComponentProps<'div'> {
  variant?: ContentCardVariant;
  padding?: ContentCardPadding;
  interactive?: boolean;
}

function ContentCard({
  className,
  variant = 'outlined',
  padding = 'default',
  interactive = false,
  ...props
}: ContentCardProps) {
  return (
    <div
      data-slot="content-card"
      className={cn(
        'rounded-(--card-radius) text-sm text-card-foreground',
        variantStyles[variant],
        paddingStyles[padding],
        interactive && [
          'cursor-pointer',
          'transition-[transform,box-shadow] duration-(--duration-fast) ease-(--ease-out)',
          'hover:-translate-y-0.5 hover:shadow-md',
          'active:scale-[0.98]',
        ],
        className,
      )}
      {...props}
    />
  );
}

function ContentCardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="content-card-header" className={cn('mb-3', className)} {...props} />;
}

function ContentCardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="content-card-title"
      className={cn('text-base font-medium leading-snug', className)}
      {...props}
    />
  );
}

function ContentCardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="content-card-description"
      className={cn('mt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { ContentCard, ContentCardHeader, ContentCardTitle, ContentCardDescription };
export type { ContentCardVariant, ContentCardPadding, ContentCardProps };

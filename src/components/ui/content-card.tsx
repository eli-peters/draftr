import * as React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { CardIconHeader } from '@/components/ui/card-icon-header';

/* ────────────────────────────────────────────────────────────────────────────
 * ContentCard — canonical content container for non-ride content.
 *
 * Variants control visual treatment:
 *   outlined  — shadow only (default; --card-border-width is 0px so no visible border)
 *   elevated  — shadow only, no border token reference
 *   flat      — no border, no shadow (blends with page)
 *   admin     — stroke-only (visible border, no shadow) for manage/admin pages
 *   alert     — tinted background + shadow (e.g. emergency contact card)
 *
 * Padding presets:
 *   none      — no padding (custom internal layout, footer sections, tabbed content)
 *   compact   — dense data display (rosters, stats, small panels)
 *   default   — standard content sections (settings, profile, forms, weather)
 *
 * Icon + heading hero: when both props are present, delegates to CardIconHeader
 * (the single canonical centred icon-above-title component). When heading is
 * present without an icon, the heading renders inline without an icon.
 *
 * Interactive adds hover/press micro-interactions for clickable cards.
 * ──────────────────────────────────────────────────────────────────────── */

const variantStyles = {
  outlined: 'border-(length:--card-border-width) border-border bg-card shadow-(--card-shadow)',
  elevated: 'bg-card shadow-(--card-shadow)',
  flat: 'bg-card',
  admin: 'border border-(--border-default) bg-card',
  alert: 'bg-feedback-error-bg shadow-(--card-shadow)',
} as const;

const paddingStyles = {
  compact: 'p-(--card-padding) md:p-(--card-padding-md)',
  default: 'p-(--card-padding-md) md:p-6',
  none: '',
} as const;

type ContentCardVariant = keyof typeof variantStyles;
type ContentCardPadding = keyof typeof paddingStyles;

interface ContentCardProps extends React.ComponentProps<'div'> {
  variant?: ContentCardVariant;
  padding?: ContentCardPadding;
  interactive?: boolean;
  /** Phosphor icon component rendered centred above the heading via CardIconHeader */
  icon?: PhosphorIcon;
  /** Heading text rendered centred inside the card at top */
  heading?: string;
  /** Subtitle text rendered below the heading (below icon+heading pair) */
  subtitle?: string;
}

function ContentCard({
  className,
  variant = 'outlined',
  padding = 'default',
  interactive = false,
  icon,
  heading,
  subtitle,
  children,
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
    >
      {(icon || heading) && (
        <div
          data-slot="content-card-hero"
          className={cn('text-center', children && 'mb-3 md:mb-4')}
        >
          {icon && heading ? (
            // Both icon and heading: use the single canonical header component.
            <CardIconHeader icon={icon} title={heading} />
          ) : (
            <>
              {icon && (
                <div className="mb-2 flex justify-center">
                  {React.createElement(icon, {
                    weight: 'duotone',
                    className: 'size-8 text-primary',
                  })}
                </div>
              )}
              {heading && (
                <h3 data-slot="content-card-heading" className="text-lg font-semibold leading-snug">
                  {heading}
                </h3>
              )}
            </>
          )}
          {subtitle && (
            <p data-slot="content-card-subtitle" className="mt-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function ContentCardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="content-card-header" className={cn('mb-3', className)} {...props} />;
}

function ContentCardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="content-card-title"
      className={cn('text-base font-semibold leading-snug', className)}
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

function ContentCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="content-card-footer"
      className={cn('mt-6 border-t border-border/30 pt-4', className)}
      {...props}
    />
  );
}

export {
  ContentCard,
  ContentCardHeader,
  ContentCardTitle,
  ContentCardDescription,
  ContentCardFooter,
};
export type { ContentCardVariant, ContentCardPadding, ContentCardProps };

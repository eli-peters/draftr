import * as React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

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
 * Section header layout: when icon + heading are both provided, renders a
 * left-aligned section header (regular-weight icon next to heading). This is
 * the routine pattern for data sections. For genuine hero use (onboarding,
 * empty states, single hero card on a page) import CardIconHeader directly
 * and place it inside children. See DESIGN_SYSTEM.md § 15.
 *
 * Interactive adds hover/press micro-interactions for clickable cards.
 * ──────────────────────────────────────────────────────────────────────── */

const variantStyles = {
  outlined: 'border-(length:--card-border-width) border-border bg-card shadow-(--card-shadow)',
  elevated: 'bg-card shadow-(--card-shadow)',
  flat: 'bg-card',
  admin: 'border border-(--border-default) bg-card dark:ring-1 dark:ring-foreground/5',
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
          'transition-[transform,box-shadow] duration-(--duration-normal) ease-(--ease-in-out)',
          'hover:-translate-y-0.5 hover:shadow-lg',
          'active:scale-[0.98]',
        ],
        className,
      )}
      {...props}
    >
      {(icon || heading) && (
        <div data-slot="content-card-header" className={cn(children && 'mb-3 md:mb-4')}>
          <div className="flex items-center gap-2">
            {icon &&
              React.createElement(icon, {
                weight: 'regular',
                className: 'size-5 shrink-0 text-muted-foreground',
              })}
            {heading && (
              <h3
                data-slot="content-card-heading"
                className="text-base font-semibold leading-snug text-foreground"
              >
                {heading}
              </h3>
            )}
          </div>
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

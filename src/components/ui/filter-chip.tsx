'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * FilterChip
 * A toggleable chip for inline filtering. Built on Base UI Toggle for
 * accessible pressed state, keyboard nav, and ToggleGroup participation.
 * -------------------------------------------------------------------------*/

const filterChipVariants = cva(
  [
    'inline-flex items-center gap-1.5 shrink-0 rounded-3xl font-medium whitespace-nowrap select-none',
    'border border-text-primary outline-none',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-fast) ease-out',
    'focus-ring',
    'active:scale-90',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        filter: [
          // Unpressed — Figma "Primary" chip: pink-subtle bg, text-primary border + text
          'bg-accent-primary-subtle text-text-primary',
          'hover:bg-chip-primary-hover-bg',
          'disabled:bg-chip-primary-disabled-bg disabled:border-chip-primary-disabled-border disabled:text-chip-primary-disabled-text',
          // Pressed — Figma "Secondary" chip: filled pink, white text, no visible border
          'data-[pressed]:bg-accent-primary-default data-[pressed]:text-text-on-primary data-[pressed]:border-transparent',
          'data-[pressed]:hover:bg-action-primary-hover',
          'data-[pressed]:disabled:bg-chip-secondary-disabled-bg data-[pressed]:disabled:text-chip-secondary-disabled-text',
          'disabled:pointer-events-none',
        ].join(' '),
        display: 'bg-accent-primary-subtle text-action-primary-subtle-text',
      },
      size: {
        default: 'px-4 py-1.5 text-sm',
        compact: "px-3 py-1 text-xs [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: 'filter',
      size: 'default',
    },
  },
);

type FilterChipOwnProps = {
  /** Display label */
  label: string;
  /** Optional leading icon */
  icon?: React.ElementType;
  /** Optional count shown after the label */
  count?: number;
} & VariantProps<typeof filterChipVariants>;

type FilterChipProps<Value extends string = string> = FilterChipOwnProps &
  Omit<Toggle.Props<Value>, keyof FilterChipOwnProps>;

function FilterChip<Value extends string = string>({
  label,
  icon: Icon,
  count,
  variant = 'filter',
  size = 'default',
  className,
  ...props
}: FilterChipProps<Value>) {
  return (
    <Toggle
      data-slot="filter-chip"
      className={cn(filterChipVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && <Icon data-icon="inline-start" />}
      <span>{label}</span>
      {count != null && <span className="opacity-70 tabular-nums">{count}</span>}
      {variant === 'filter' && (
        <XCircleIcon weight="fill" className="hidden size-4 in-data-pressed:block" />
      )}
    </Toggle>
  );
}

/* ---------------------------------------------------------------------------
 * FilterChipGroup
 * Wraps Base UI ToggleGroup with layout and keyboard nav.
 * -------------------------------------------------------------------------*/

type FilterChipGroupProps<Value extends string = string> = Omit<ToggleGroup.Props<Value>, never>;

function FilterChipGroup<Value extends string = string>({
  className,
  children,
  ...props
}: FilterChipGroupProps<Value>) {
  return (
    <ToggleGroup
      data-slot="filter-chip-group"
      loopFocus
      className={cn('flex w-full flex-wrap items-center justify-center gap-2', className)}
      {...props}
    >
      {children}
    </ToggleGroup>
  );
}

export { FilterChip, FilterChipGroup, filterChipVariants };
// Aliases for canonical Chip API
export { FilterChip as Chip, FilterChipGroup as ChipGroup, filterChipVariants as chipVariants };

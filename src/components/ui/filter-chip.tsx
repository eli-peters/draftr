'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * FilterChip
 * A toggleable chip for inline filtering. Built on Base UI Toggle for
 * accessible pressed state, keyboard nav, and ToggleGroup participation.
 * -------------------------------------------------------------------------*/

const filterChipVariants = cva(
  [
    'inline-flex items-center gap-1.5 shrink-0 rounded-full font-medium whitespace-nowrap select-none',
    'border border-accent-primary-muted outline-none',
    'transition-[background-color,color,box-shadow,transform] duration-160 ease-out',
    'focus-ring',
    'active:scale-90',
    'disabled:pointer-events-none disabled:bg-action-disabled-bg disabled:text-action-disabled-text',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        filter: [
          // Default (unpressed)
          'bg-accent-primary-subtle text-text-primary',
          'hover:bg-accent-primary-muted hover:text-text-primary',
          // Pressed — shows X icon for deselect affordance
          'data-[pressed]:bg-accent-primary-default data-[pressed]:text-text-on-primary data-[pressed]:border-accent-primary-default',
          'data-[pressed]:hover:bg-action-primary-hover',
        ].join(' '),
        display: 'bg-accent-primary-subtle text-action-primary-subtle-text',
      },
      size: {
        default: 'px-3 py-1.5 text-sm',
        compact: "px-2.5 py-1 text-xs [&_svg:not([class*='size-'])]:size-3.5",
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
      {variant === 'filter' && <XIcon className="hidden size-3.5 in-data-pressed:block" />}
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
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
      {...props}
    >
      {children}
    </ToggleGroup>
  );
}

export { FilterChip, FilterChipGroup, filterChipVariants };

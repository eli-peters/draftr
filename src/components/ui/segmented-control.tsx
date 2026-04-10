'use client';

import { useId } from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { motion, type Transition } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * SegmentedControl
 *
 * Rounded-rectangle picker for mutually-exclusive values, inspired by iOS's
 * UISegmentedControl but built on Draftr's tokens and the existing font
 * stack. The active pill slides between positions with a damped spring.
 *
 * Built on Base UI ToggleGroup so keyboard nav and aria come for free.
 * Use for value-pair choices (km/mi, °C/°F, Light/Dark etc.). For on/off
 * use Toggle. For multi-select use FilterChipGroup.
 * -------------------------------------------------------------------------*/

// Damped spring for the active-pill slide. Reasonable defaults — not copied
// from Apple's values.
const SEGMENT_SPRING: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 40,
  mass: 0.8,
};

const segmentedControlListVariants = cva(
  'relative inline-flex items-center rounded-xl bg-surface-sunken p-0.5 outline-none',
  {
    variants: {
      size: {
        default: 'h-9',
        compact: 'h-8',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const segmentedControlItemVariants = cva(
  [
    'relative inline-flex flex-1 min-w-0 items-center justify-center whitespace-nowrap select-none',
    'font-semibold text-foreground',
    'rounded-lg',
    'transition-colors duration-(--duration-fast) ease-(--ease-out)',
    'focus-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'h-8 px-4 text-sm',
        compact: 'h-7 px-4 text-xs',
      },
      colorScheme: {
        primary: 'data-[pressed]:text-text-on-primary',
        secondary: 'data-[pressed]:text-text-on-secondary',
      },
    },
    defaultVariants: { size: 'default', colorScheme: 'primary' },
  },
);

interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

interface SegmentedControlProps<V extends string> extends VariantProps<
  typeof segmentedControlListVariants
> {
  value: V;
  onValueChange: (value: V) => void;
  options: ReadonlyArray<SegmentedOption<V>>;
  colorScheme?: 'primary' | 'secondary';
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<V extends string>({
  value,
  onValueChange,
  options,
  size = 'default',
  colorScheme = 'primary',
  ariaLabel,
  disabled,
  className,
}: SegmentedControlProps<V>) {
  // useId gives each instance a unique layoutId namespace so multiple
  // segmented controls on the same page don't cross-animate their pills.
  const instanceId = useId();
  const layoutId = `segmented-pill-${instanceId}`;
  const pillBgClass = colorScheme === 'secondary' ? 'bg-action-secondary' : 'bg-action-primary';

  return (
    <ToggleGroup<V>
      data-slot="segmented-control"
      data-vaul-no-drag
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next) => {
        // Single-select: ignore deselection so one option always stays active.
        const picked = next[0];
        if (picked != null && picked !== value) onValueChange(picked);
      }}
      disabled={disabled}
      className={cn(segmentedControlListVariants({ size }), className)}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Toggle<V>
            key={opt.value}
            value={opt.value}
            className={cn(segmentedControlItemVariants({ size, colorScheme }))}
          >
            {isActive && (
              <motion.span
                aria-hidden
                layoutId={layoutId}
                transition={SEGMENT_SPRING}
                className={cn('absolute inset-0 rounded-lg shadow-sm', pillBgClass)}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

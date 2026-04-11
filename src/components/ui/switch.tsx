'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * Toggle
 *
 * Stretched on/off switch inspired by iOS 26's elongated toggle — wider
 * track, capsule-shaped thumb rather than a perfect circle. Uses Draftr's
 * semantic tokens and Tailwind scale, not copied iOS specs.
 *
 * - Track: 2:1 stretched stadium (h-7 w-14)
 * - Thumb: 1.33:1 horizontal capsule (h-6 w-8) with 2px inset
 * - White thumb in both modes (consistent identity cue)
 *
 * Built on Base UI Switch so focus, keyboard, and form submission come for
 * free. Use this for boolean state. For mutually-exclusive value picking,
 * use SegmentedControl instead.
 * -------------------------------------------------------------------------*/

const toggleTrackVariants = cva(
  [
    'peer group/toggle relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full',
    'border border-transparent outline-none',
    'transition-[background-color,border-color,box-shadow,filter] duration-(--duration-normal) ease-(--ease-out)',
    'hover:brightness-[0.97]',
    'focus-ring invalid-ring',
    // Expand hit target without affecting layout
    'after:absolute after:-inset-x-3 after:-inset-y-2',
    'data-unchecked:bg-input dark:data-unchecked:bg-input/80',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    'dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  ].join(' '),
  {
    variants: {
      colorScheme: {
        primary: 'data-checked:bg-action-primary',
        secondary: 'data-checked:bg-action-secondary',
      },
    },
    defaultVariants: { colorScheme: 'primary' },
  },
);

// Capsule thumb: fully-rounded rectangle, white in both modes (iOS-inspired
// identity cue). Travel = 20px: off at 2px left inset, on at 22px.
const TOGGLE_THUMB_CLASS = [
  'pointer-events-none block h-6 w-8 translate-x-0.5 rounded-full bg-white ring-0 shadow-md',
  'transition-transform duration-(--duration-normal) [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)]',
  'data-checked:translate-x-[22px]',
  'motion-reduce:duration-100',
].join(' ');

export interface ToggleProps
  extends SwitchPrimitive.Root.Props, VariantProps<typeof toggleTrackVariants> {}

function Toggle({ className, colorScheme = 'primary', ...props }: ToggleProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="toggle"
      data-vaul-no-drag
      className={cn(toggleTrackVariants({ colorScheme }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="toggle-thumb" className={TOGGLE_THUMB_CLASS} />
    </SwitchPrimitive.Root>
  );
}

export { Toggle };
// Alias so legacy `Switch` imports resolve without touching every call site.
export { Toggle as Switch };

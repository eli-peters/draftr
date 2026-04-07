import { useReducedMotion, type Transition, type Variants } from 'framer-motion';

/**
 * Motion primitives for Draftr.
 *
 * Source of truth for durations and easings is `globals.css`
 * (`--duration-*`, `--ease-*`). The values below mirror those CSS tokens
 * so Framer Motion animations match the rest of the app exactly.
 *
 * Always import from here — never inline ms values or bezier curves.
 */

// Durations in seconds — mirror --duration-fast/normal/slow in globals.css
export const DURATIONS = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
} as const;

// Easing curves — mirror --ease-out/in-out/drawer in globals.css
export const EASE = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const,
};

const baseTransition: Transition = {
  duration: DURATIONS.normal,
  ease: EASE.out,
};

// Single item entering/leaving — fades and rises slightly
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
  exit: { opacity: 0, y: 8, transition: { duration: DURATIONS.fast, ease: EASE.out } },
};

// Subtle scale-in for badges, popovers, key state changes
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
  exit: { opacity: 0, scale: 0.94, transition: { duration: DURATIONS.fast, ease: EASE.out } },
};

// List item that may be reordered (waitlist → confirmed). Pair with `layout`.
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
  exit: { opacity: 0, x: -20, transition: { duration: DURATIONS.fast, ease: EASE.out } },
};

/**
 * Container variant that staggers its children.
 * Use with motion children carrying `variants={fadeSlideUp}` (or similar).
 */
export function staggerContainer(stagger = 0.04, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
    exit: {
      transition: {
        staggerChildren: stagger / 2,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Reduced-motion-aware variant resolver.
 *
 * Returns the supplied variants as-is when motion is allowed; collapses
 * transforms to opacity-only fades (and zero duration where appropriate)
 * when the user has requested reduced motion.
 *
 * Use for *decorative* motion. For motion that conveys meaning
 * (e.g. a list item appearing), prefer keeping the fade and dropping only
 * the transform.
 */
export function useMotionPresets() {
  const shouldReduce = useReducedMotion();

  function resolve(variants: Variants): Variants {
    if (!shouldReduce) return variants;
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: DURATIONS.fast } },
      exit: { opacity: 0, transition: { duration: DURATIONS.fast } },
    };
  }

  return {
    shouldReduce: !!shouldReduce,
    fadeSlideUp: resolve(fadeSlideUp),
    fadeScale: resolve(fadeScale),
    listItem: resolve(listItem),
    staggerContainer: (stagger?: number, delayChildren?: number) =>
      shouldReduce ? staggerContainer(0, 0) : staggerContainer(stagger, delayChildren),
  };
}

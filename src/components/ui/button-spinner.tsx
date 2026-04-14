import { SpinnerGap } from '@phosphor-icons/react/dist/ssr';

interface ButtonSpinnerProps {
  /** Tailwind size class for the icon. Default `size-4`. */
  className?: string;
}

/**
 * Inline loading spinner for buttons during pending states.
 *
 * Drop-in replacement for a button's icon while an async action runs.
 * Uses the same SpinnerGap icon used across the app (route import,
 * card signup, toast loading).
 *
 * Reduced motion: `animate-spin` is disabled by the browser when
 * `prefers-reduced-motion: reduce` is active, so the icon renders
 * as a static gap-circle — still communicates "loading" without motion.
 */
export function ButtonSpinner({ className = 'size-4' }: ButtonSpinnerProps) {
  return <SpinnerGap className={`${className} animate-spin`} />;
}

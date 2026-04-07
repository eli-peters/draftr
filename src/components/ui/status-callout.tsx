import * as React from 'react';

import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────────────────
 * StatusCallout — inline alert / status surface.
 *
 * Use for warning, error, info, and success messages that appear inline in
 * page content (form errors, severe weather notice, destructive confirms).
 * Tones map to the canonical --feedback-* token family.
 *
 * The component is layout-agnostic — pass children with their own flex/grid
 * structure, or override padding/spacing via className.
 * ──────────────────────────────────────────────────────────────────────── */

const toneStyles = {
  error: 'border-feedback-error bg-feedback-error-bg text-feedback-error-text',
  warning: 'border-feedback-warning bg-feedback-warning-bg text-feedback-warning-text',
  info: 'border-feedback-info bg-feedback-info-bg text-feedback-info-text',
  success: 'border-feedback-success bg-feedback-success-bg text-feedback-success-text',
} as const;

type StatusCalloutTone = keyof typeof toneStyles;

interface StatusCalloutProps extends React.ComponentProps<'div'> {
  tone?: StatusCalloutTone;
}

export function StatusCallout({
  tone = 'info',
  className,
  children,
  ...props
}: StatusCalloutProps) {
  return (
    <div className={cn('rounded-xl border p-4', toneStyles[tone], className)} {...props}>
      {children}
    </div>
  );
}

export type { StatusCalloutTone, StatusCalloutProps };

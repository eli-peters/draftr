import type React from 'react';

/**
 * Shared toast action button styles using Sonner's actionButtonStyle API.
 * Toasts use Style 1 (solid saturated bg), so action buttons sit on a
 * coloured surface. Actions use a translucent white fill with white text,
 * except Warning (dark text on amber).
 */
const ACTION_BUTTON_BASE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  borderRadius: 'var(--radius)',
};

const ON_COLOURED: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: 'color-mix(in srgb, var(--surface-default) 18%, transparent)',
  color: 'var(--surface-default)',
  border: '1px solid color-mix(in srgb, var(--surface-default) 28%, transparent)',
};

const ON_WARNING: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
  color: 'var(--text-primary)',
  border: '1px solid color-mix(in srgb, var(--text-primary) 24%, transparent)',
};

export const TOAST_ACTION_STYLES = {
  success: ON_COLOURED,
  info: ON_COLOURED,
  warning: ON_WARNING,
  error: ON_COLOURED,
} as const;

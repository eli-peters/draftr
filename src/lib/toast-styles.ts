import type React from 'react';

/**
 * Shared toast action button styles using Sonner's actionButtonStyle API.
 * Overrides Sonner's runtime-injected CSS with semantic token colours.
 */
const ACTION_BUTTON_BASE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  borderRadius: 'var(--radius)',
};

function actionButtonStyle(tokenPrefix: string): React.CSSProperties {
  return {
    ...ACTION_BUTTON_BASE,
    background: `color-mix(in srgb, var(--${tokenPrefix}-text) 15%, transparent)`,
    color: `var(--${tokenPrefix}-text)`,
    border: `1px solid color-mix(in srgb, var(--${tokenPrefix}-text) 25%, transparent)`,
  };
}

export const TOAST_ACTION_STYLES = {
  success: actionButtonStyle('feedback-success'),
  info: actionButtonStyle('feedback-info'),
  warning: actionButtonStyle('feedback-warning'),
  error: actionButtonStyle('feedback-error'),
} as const;

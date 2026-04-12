import type React from 'react';

/**
 * ── Toast Content Format Conventions ──
 *
 * SINGLE-LINE — title only, via toast.success(message) / toast.error(message)
 * Use for fast acknowledgements where the outcome is self-evident:
 *   - "Ride cancelled"
 *   - "Profile saved"
 *   - "Strava connected successfully!"
 *   - "Settings updated"
 *
 * DOUBLE-LINE — title + description, via toast.success(title, { description })
 * Use when extra context helps the user understand what happened AND what
 * comes next or what it means:
 *   - "You're in for Saturday Ride" + "You'll get a reminder before the ride"
 *   - "On the waitlist" + "We'll notify you if a spot opens up"
 *   - "Invite sent" + "Riley will receive an email shortly"
 *   - "Removed from ride" + "You can rejoin anytime before the ride"
 *
 * Rule of thumb: if the user might wonder "ok, so now what?" after reading
 * just the title, add a description. If the title fully resolves the action
 * ("Profile saved"), skip the description.
 *
 * All toast strings live in src/content/ files (app.ts, settings.ts).
 * Never hardcode toast text in components.
 */

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

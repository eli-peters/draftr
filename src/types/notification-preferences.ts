/* ---------------------------------------------------------------------------
 * Notification preferences — shape + normaliser
 *
 * Only delivery channels for now. Per-event toggles ("ride reminders", "new
 * ride posted", etc.) are deferred — see the project backlog. The read shim
 * normalises both new nested `{ channels }` and legacy flat `{ push, email }`
 * JSONB so callers never have to care which era a row was written in.
 * -------------------------------------------------------------------------*/

export type NotificationChannel = 'push' | 'email';

export interface NotificationPreferences {
  channels: Record<NotificationChannel, boolean>;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  channels: { push: true, email: true },
};

/**
 * Normalise raw JSONB from `users.notification_preferences` into the canonical
 * shape. Accepts the new nested form or legacy flat form and returns sensible
 * defaults for anything missing.
 */
export function readNotificationPreferences(raw: unknown): NotificationPreferences {
  const obj = (raw as Record<string, unknown> | null) ?? {};

  // Channels — prefer nested `channels`, fall back to legacy top-level keys
  const nestedChannels = obj.channels as Record<string, unknown> | undefined;
  const push =
    typeof nestedChannels?.push === 'boolean'
      ? nestedChannels.push
      : typeof obj.push === 'boolean'
        ? obj.push
        : defaultNotificationPreferences.channels.push;
  const email =
    typeof nestedChannels?.email === 'boolean'
      ? nestedChannels.email
      : typeof obj.email === 'boolean'
        ? obj.email
        : defaultNotificationPreferences.channels.email;

  return { channels: { push, email } };
}

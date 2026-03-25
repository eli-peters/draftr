import type { BadgeVariant } from '@/components/ui/badge';

/** Date format patterns used with date-fns format() */
export const dateFormats = {
  /** "Mon" */
  dayShort: 'EEE',
  /** "Jan 5" */
  monthDay: 'MMM d',
  /** "Mon, Jan 5" */
  dayMonthDay: 'EEE, MMM d',
  /** "Monday, January 5, 2025" */
  full: 'EEEE, MMMM d, yyyy',
  /** "Jan 2025" */
  monthYear: 'MMM yyyy',
} as const;

/** Text separators */
export const separators = {
  /** " · " — middle dot with spaces */
  dot: ' · ',
  /** " – " — en-dash with spaces */
  dash: ' – ',
  /** " at " — date-time connector */
  at: ' at ',
  /** " — " — em-dash with spaces */
  emDash: ' — ',
} as const;

/** Format a time string (HH:MM:SS) to display format (HH:MM) */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** Get today's date as an ISO string (YYYY-MM-DD) */
export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/** Measurement unit suffixes */
export const units = {
  km: ' km',
  m: ' m',
  kmh: ' km/h',
  celsius: '°C',
  percent: '%',
  mm: ' mm',
  hours: 'h',
  minutes: 'm',
} as const;

/**
 * Compute ride duration from start/end time strings (HH:MM or HH:MM:SS).
 * Returns a formatted string like "4h 42m", or null if end_time is missing.
 */
export function formatDuration(startTime: string, endTime: string | null): string | null {
  if (!endTime) return null;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (totalMinutes <= 0) return null;

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}${units.minutes}`;
  if (m === 0) return `${h}${units.hours}`;
  return `${h}${units.hours} ${m}${units.minutes}`;
}

/** Get badge variant for a pace group by sort order (1–8). */
export function getPaceBadgeVariant(sortOrder: number): BadgeVariant {
  const slot = Math.min(Math.max(sortOrder, 1), 8);
  return `pace-${slot}` as BadgeVariant;
}

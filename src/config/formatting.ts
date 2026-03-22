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
} as const;

/** Get badge variant for a pace group by sort order (1–8). */
export function getPaceBadgeVariant(sortOrder: number): BadgeVariant {
  const slot = Math.min(Math.max(sortOrder, 1), 8);
  return `pace-${slot}` as BadgeVariant;
}

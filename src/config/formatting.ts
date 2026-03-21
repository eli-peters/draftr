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
} as const;

/** Measurement unit suffixes */
export const units = {
  km: ' km',
  m: ' m',
  kmh: ' km/h',
} as const;

import type { BadgeVariant } from '@/components/ui/badge';

/** Pace-level badge variants */
type PaceBadgeVariant = Extract<
  BadgeVariant,
  'pace-social' | 'pace-intermediate' | 'pace-advanced' | 'pace-elite'
>;

/** Map pace group names (from DB) to badge variant keys */
const paceVariantMap: Record<string, PaceBadgeVariant> = {
  social: 'pace-social',
  intermediate: 'pace-intermediate',
  'intermediate a': 'pace-intermediate',
  'intermediate b': 'pace-intermediate',
  advanced: 'pace-advanced',
  elite: 'pace-elite',
};

/** Get badge variant for a pace group name, falling back to social */
export function getPaceBadgeVariant(paceGroupName: string): PaceBadgeVariant {
  return paceVariantMap[paceGroupName.toLowerCase()] ?? 'pace-social';
}

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

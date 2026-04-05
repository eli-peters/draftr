import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { isToday, isTomorrow, differenceInCalendarDays, format } from 'date-fns';
import { appContent } from '@/content/app';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['overline', 'body-sm', 'body-lg', 'caption-sm', 'micro', 'compact'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRelativeDay(
  date: Date,
  fallbackFormat: string = 'EEEE',
  includeDate: boolean = false,
): string {
  if (isToday(date)) return appContent.common.today;
  if (isTomorrow(date)) return appContent.common.tomorrow;
  const daysAway = differenceInCalendarDays(date, new Date());
  if (daysAway <= 6) {
    // Within 6 days — day name, optionally with date (e.g. "Sun, Mar 30")
    if (includeDate) return `${format(date, fallbackFormat)}, ${format(date, 'MMM d')}`;
    return format(date, fallbackFormat);
  }
  // 7+ days — absolute date (e.g. "Sun, Apr 5")
  return format(date, 'EEE, MMM d');
}

const BADGE_COUNT_CAP = 9;

export function formatBadgeCount(count: number): string {
  return count > BADGE_COUNT_CAP ? `${BADGE_COUNT_CAP}+` : `${count}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Shorten a full address by removing postal/zip code and country.
 * e.g. "391 King St W, Toronto, ON M5V 2G5, Canada" → "391 King St W, Toronto, ON"
 */
export function shortenAddress(address: string): string {
  if (!address) return address;
  // Split into parts, filter out country and postal/zip codes
  const parts = address.split(',').map((p) => p.trim());
  const filtered = parts
    .filter((part) => {
      // Remove country names
      if (/^(Canada|United States|USA|US)$/i.test(part)) return false;
      // Remove standalone postal/zip codes (Canadian: A1A 1A1, US: 12345 or 12345-6789)
      if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(part)) return false;
      if (/^\d{5}(-\d{4})?$/.test(part)) return false;
      // Remove postal/zip code appended to a province/state (e.g. "ON M5V 2G5")
      const withoutPostal = part
        .replace(/\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, '')
        .replace(/\s+\d{5}(-\d{4})?$/, '');
      if (withoutPostal !== part) {
        // Replace this part with the cleaned version (handled below)
        return true;
      }
      return true;
    })
    .map((part) => {
      // Clean postal codes appended to province/state
      return part.replace(/\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, '').replace(/\s+\d{5}(-\d{4})?$/, '');
    });
  return filtered.join(', ');
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isToday, isTomorrow, differenceInCalendarDays, format } from 'date-fns';
import { appContent } from '@/content/app';

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

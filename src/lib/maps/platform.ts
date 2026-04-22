export type MapsPlatform = 'ios' | 'android' | 'web';

/**
 * Detect the maps platform from a UA string (and optional touch-point count,
 * used to disambiguate iPadOS which reports as Mac).
 */
export function detectMapsPlatform(userAgent: string, maxTouchPoints = 0): MapsPlatform {
  if (/iPhone|iPod/.test(userAgent)) return 'ios';
  if (/iPad/.test(userAgent)) return 'ios';
  // iPadOS 13+ masquerades as Mac; distinguish via multi-touch support.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'web';
}

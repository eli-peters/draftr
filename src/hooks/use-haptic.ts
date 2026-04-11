'use client';

/**
 * Haptic feedback via the Web Vibration API.
 *
 * iOS Safari ignores navigator.vibrate() (silent no-op), Android gets
 * real vibration. When we wrap in Capacitor later, swap the internals
 * to Capacitor Haptics without changing the call sites.
 */
export function useHaptic() {
  const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    /** Ultra-short tap (10ms) — toggles, tab switches */
    light: () => vibrate(10),
    /** Medium tap (20ms) — primary CTAs, signup */
    medium: () => vibrate(20),
    /** Double-tap pattern — success confirmation */
    success: () => vibrate([10, 50, 10]),
  };
}

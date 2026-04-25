'use client';

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic feedback. Native iOS/Android via @capacitor/haptics, with a
 * navigator.vibrate fallback for the PWA path. iOS Safari ignores
 * navigator.vibrate, so the PWA fallback is effectively Android-only.
 */
export function useHaptic() {
  const isNative = Capacitor.isNativePlatform();

  const webVibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    /** Ultra-short tap — toggles, tab switches */
    light: () => {
      if (isNative) {
        void Haptics.impact({ style: ImpactStyle.Light });
      } else {
        webVibrate(10);
      }
    },
    /** Medium tap — primary CTAs, signup */
    medium: () => {
      if (isNative) {
        void Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        webVibrate(20);
      }
    },
    /** Success notification — confirmation moments */
    success: () => {
      if (isNative) {
        void Haptics.notification({ type: NotificationType.Success });
      } else {
        webVibrate([10, 50, 10]);
      }
    },
  };
}

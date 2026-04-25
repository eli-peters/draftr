'use client';

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Native share sheet on Capacitor; Web Share API where available;
 * clipboard fallback otherwise. Returns true if anything happened
 * (share completed or text was copied), false on user cancel.
 */
export async function share(options: ShareOptions): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share(options);
      return true;
    } catch {
      return false;
    }
  }

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch {
      return false;
    }
  }

  const fallback = options.url ?? options.text ?? '';
  if (!fallback || typeof navigator === 'undefined') return false;
  const clipboard = (navigator as Navigator).clipboard;
  if (!clipboard) return false;
  try {
    await clipboard.writeText(fallback);
    return true;
  } catch {
    return false;
  }
}

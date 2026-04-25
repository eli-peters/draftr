'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useTheme } from '@/components/theme-provider';
import { startNetworkWatcher } from '@/lib/native/network-watcher';

/**
 * Wires Capacitor-only runtime concerns:
 *  - StatusBar style follows resolved color mode
 *  - appUrlOpen routes deep links into the Next.js router
 *
 * No-op on the web PWA path.
 */
export function NativeBridge() {
  const { resolvedColorMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({
      style: resolvedColorMode === 'dark' ? Style.Dark : Style.Light,
    });
  }, [resolvedColorMode]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handle = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        const path = `${url.pathname}${url.search}${url.hash}`;
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (path && path !== currentPath) router.push(path);
      } catch {
        // ignore malformed URLs
      }
    });

    return () => {
      void handle.then((h) => h.remove());
    };
  }, [router]);

  useEffect(() => {
    return startNetworkWatcher();
  }, []);

  return null;
}

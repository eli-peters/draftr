'use client';

import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { toast } from 'sonner';
import { appContent } from '@/content/app';

type Cleanup = () => void;

/**
 * Surfaces online/offline transitions as toasts. Uses @capacitor/network
 * on native, the browser online/offline events on the web. Returns a
 * cleanup function for use inside an effect.
 */
export function startNetworkWatcher(): Cleanup {
  let lastOnline = true;
  let toastId: string | number | undefined;

  const onChange = (online: boolean) => {
    if (online === lastOnline) return;
    lastOnline = online;
    if (!online) {
      toastId = toast.error(appContent.system.offline, { duration: Infinity });
    } else {
      if (toastId !== undefined) toast.dismiss(toastId);
      toastId = undefined;
      toast.success(appContent.system.backOnline);
    }
  };

  if (Capacitor.isNativePlatform()) {
    let removeFn: (() => void) | undefined;
    void Network.getStatus().then((s) => {
      lastOnline = s.connected;
    });
    void Network.addListener('networkStatusChange', (s) => onChange(s.connected)).then((handle) => {
      removeFn = () => void handle.remove();
    });
    return () => {
      removeFn?.();
    };
  }

  if (typeof window === 'undefined') return () => {};
  lastOnline = navigator.onLine;
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

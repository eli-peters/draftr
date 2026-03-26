'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Wrench, CloudArrowDown, X, SpinnerGap } from '@phosphor-icons/react/dist/ssr';
import { devSyncWeather } from '@/lib/dev/actions';

/**
 * Floating dev toolbar — only rendered in development.
 * Provides quick actions for local development and testing.
 */
export function DevToolbar() {
  const [open, setOpen] = useState(false);
  const [syncing, startSync] = useTransition();

  function handleSyncWeather() {
    startSync(async () => {
      const result = await devSyncWeather();
      if (result.success) {
        const r = result.results;
        const details = r
          ? [
              `${r.rides} rides`,
              r.watchSet > 0 ? `${r.watchSet} watch set` : null,
              r.watchReverted > 0 ? `${r.watchReverted} reverted` : null,
              r.cleaned > 0 ? `${r.cleaned} cleaned` : null,
            ]
              .filter(Boolean)
              .join(', ')
          : '';
        toast.success(result.message, { description: details || undefined });
      } else {
        toast.error('Weather sync failed', { description: result.message });
      }
    });
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-4">
      {open && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-primary p-2 shadow-lg">
          <button
            onClick={handleSyncWeather}
            disabled={syncing}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {syncing ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <CloudArrowDown size={16} />
            )}
            Sync Weather
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-primary shadow-lg transition-colors hover:bg-surface-hover"
        title="Dev Tools"
      >
        {open ? <X size={18} /> : <Wrench size={18} />}
      </button>
    </div>
  );
}

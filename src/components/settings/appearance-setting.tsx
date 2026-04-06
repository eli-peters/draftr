'use client';

import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { useTheme } from '@/components/theme-provider';
import { appContent } from '@/content/app';
import { cn } from '@/lib/utils';
import type { ColorMode } from '@/types/theme';

const {
  settings: { appearance: content },
} = appContent;

const options: { value: ColorMode; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: content.options.system, icon: Monitor },
  { value: 'light', label: content.options.light, icon: Sun },
  { value: 'dark', label: content.options.dark, icon: Moon },
];

export function AppearanceSetting() {
  const { colorMode, setColorMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const activeMode = mounted ? colorMode : null;

  return (
    <ContentCard padding="compact" heading={content.heading}>
      <div
        role="radiogroup"
        aria-label={content.heading}
        className="inline-flex items-center rounded-full bg-tabs-list-bg p-1"
      >
        {options.map(({ value, label, icon: Icon }) => {
          const isActive = activeMode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setColorMode(value)}
              className={cn(
                'relative inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-(--duration-normal) ease-(--ease-out)',
                isActive
                  ? 'bg-tabs-trigger-active-bg text-tabs-trigger-active-text shadow-sm'
                  : 'text-tabs-trigger-text hover:bg-muted',
              )}
            >
              <Icon weight={isActive ? 'fill' : undefined} className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </ContentCard>
  );
}

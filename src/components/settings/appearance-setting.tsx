'use client';

import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
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

  // Before hydration, treat all buttons as unselected to avoid mismatch
  const activeMode = mounted ? colorMode : null;

  return (
    <ContentCard padding="compact" heading={content.heading}>
      <div className="inline-flex rounded-lg bg-muted p-1">
        {options.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => setColorMode(value)}
            className={cn(
              activeMode === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            <Icon weight={activeMode === value ? 'fill' : undefined} className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </ContentCard>
  );
}

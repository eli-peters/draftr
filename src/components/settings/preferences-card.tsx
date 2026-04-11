'use client';

import { useEffect, useState, useTransition } from 'react';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SettingRow } from '@/components/settings/setting-row';
import { useTheme } from '@/components/theme-provider';
import { settingsContent } from '@/content/settings';
import { updateUserPreferences } from '@/lib/profile/actions';
import type { UserPreferences } from '@/types/user-preferences';
import type { ColorMode } from '@/types/theme';

const { preferences: content } = settingsContent;

/* ---------------------------------------------------------------------------
 * PreferencesCard
 * -------------------------------------------------------------------------*/

interface PreferencesCardProps {
  userPrefs: UserPreferences;
}

export function PreferencesCard({ userPrefs }: PreferencesCardProps) {
  const { colorMode, setColorMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  // Hydration guard — colorMode reads localStorage, unavailable on server
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  function save(patch: Partial<UserPreferences>) {
    startTransition(async () => {
      const result = await updateUserPreferences(patch);
      if (result && 'error' in result) {
        toast.error(result.error);
      }
    });
  }

  const activeColorMode: ColorMode = mounted ? colorMode : 'system';

  return (
    <ContentCard icon={SlidersHorizontal} heading={content.title}>
      <div className="divide-y divide-border">
        {/* Distance */}
        <SettingRow label={content.rows.distance.label}>
          <SegmentedControl
            size="compact"
            ariaLabel={content.rows.distance.label}
            value={userPrefs.distance_unit}
            onValueChange={(v) => save({ distance_unit: v as UserPreferences['distance_unit'] })}
            options={Object.entries(content.rows.distance.options).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </SettingRow>

        {/* Elevation */}
        <SettingRow label={content.rows.elevation.label}>
          <SegmentedControl
            size="compact"
            ariaLabel={content.rows.elevation.label}
            value={userPrefs.elevation_unit}
            onValueChange={(v) => save({ elevation_unit: v as UserPreferences['elevation_unit'] })}
            options={Object.entries(content.rows.elevation.options).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </SettingRow>

        {/* Temperature */}
        <SettingRow label={content.rows.temperature.label}>
          <SegmentedControl
            size="compact"
            ariaLabel={content.rows.temperature.label}
            value={userPrefs.temperature_unit}
            onValueChange={(v) =>
              save({ temperature_unit: v as UserPreferences['temperature_unit'] })
            }
            options={Object.entries(content.rows.temperature.options).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </SettingRow>

        {/* Time format */}
        <SettingRow label={content.rows.timeFormat.label}>
          <SegmentedControl
            size="compact"
            ariaLabel={content.rows.timeFormat.label}
            value={userPrefs.time_format}
            onValueChange={(v) => save({ time_format: v as UserPreferences['time_format'] })}
            options={Object.entries(content.rows.timeFormat.options).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </SettingRow>

        {/* Appearance — reads/writes theme state directly */}
        <SettingRow label={content.rows.appearance.label}>
          <SegmentedControl
            size="compact"
            ariaLabel={content.rows.appearance.label}
            value={activeColorMode}
            onValueChange={(v) => setColorMode(v as ColorMode)}
            options={Object.entries(content.rows.appearance.options).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </SettingRow>
      </div>
    </ContentCard>
  );
}

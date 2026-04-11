'use client';

import { WeatherIcon } from '@/components/weather/weather-icon';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { appContent } from '@/content/app';
import { getConditionColorClass } from '@/config/weather';
import { units, formatTemperature } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { RideWeatherSnapshot } from '@/types/database';

const { weather: weatherContent } = appContent;

interface RideWeatherSummaryProps {
  weather: RideWeatherSnapshot | null;
}

/**
 * Compact weather summary row for the ride detail page.
 * Shows icon + temperature + feels-like + chance of rain.
 */
export function RideWeatherSummary({ weather }: RideWeatherSummaryProps) {
  const prefs = useUserPrefs();
  if (!weather || weather.temperature_c == null) return null;

  const feelsLike = weather.feels_like_c ?? weather.temperature_c;
  const popPercent = weather.pop != null ? Math.round(weather.pop * 100) : null;

  return (
    <div className="mt-1 flex items-center gap-2">
      <WeatherIcon
        weatherCode={weather.weather_code}
        isDay={weather.is_day}
        className={cn('size-5', getConditionColorClass(weather.weather_code, weather.is_day))}
      />
      <span className="font-display text-lg font-semibold text-foreground">
        {formatTemperature(weather.temperature_c, prefs.temperature_unit)}
      </span>
      <span className="text-body-sm text-muted-foreground">
        {weatherContent.feelsLike(formatTemperature(feelsLike, prefs.temperature_unit))}
        {popPercent != null && (
          <>
            <span className="mx-1.5">·</span>
            {weatherContent.detail.chanceOfRain}: {popPercent}
            {units.percent}
          </>
        )}
      </span>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Wind } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { WeatherIcon } from '@/components/weather/weather-icon';
import { appContent } from '@/content/app';
import {
  getWeatherCondition,
  getConditionColorClass,
  GEOLOCATION_TIMEOUT_MS,
  GEOLOCATION_MAX_AGE_MS,
} from '@/config/weather';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { units, formatTemperature } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { CurrentWeatherData } from '@/lib/weather/api';

const { weather: weatherContent } = appContent;

/**
 * Live weather widget for the home page.
 * Client component — uses browser geolocation to fetch current weather.
 */
export function CurrentWeather() {
  const prefs = useUserPrefs();
  const [weather, setWeather] = useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/weather/current?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            setWeather(data);
          }
        } catch {
          // Silently fail — weather is non-critical
        } finally {
          setLoading(false);
        }
      },
      () => {
        // Geolocation denied or unavailable — show nothing
        setLoading(false);
      },
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: GEOLOCATION_MAX_AGE_MS },
    );
  }, []);

  if (loading) {
    return (
      <ContentCard padding="none" className="flex h-15.5 items-center gap-3 px-4 py-3">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      </ContentCard>
    );
  }

  if (!weather || weather.temperature_c == null) return null;

  const condition = getWeatherCondition(weather.weather_code);

  return (
    <ContentCard padding="none" className="flex items-center gap-3 px-4 py-3">
      <WeatherIcon
        weatherCode={weather.weather_code}
        isDay={weather.is_day}
        className={cn('size-10', getConditionColorClass(weather.weather_code, weather.is_day))}
      />

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-bold leading-tight text-foreground">
            {formatTemperature(weather.temperature_c, prefs.temperature_unit)}
          </span>
          <span className="text-sm text-muted-foreground">{condition.label}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {weather.feels_like_c != null && (
            <span>
              {weatherContent.feelsLike(
                formatTemperature(weather.feels_like_c, prefs.temperature_unit),
              )}
            </span>
          )}
          {weather.wind_speed_kmh != null && (
            <span className="flex items-center gap-0.5">
              <Wind className="size-3" />
              {Math.round(weather.wind_speed_kmh)}
              {units.kmh}
            </span>
          )}
        </div>
      </div>
    </ContentCard>
  );
}

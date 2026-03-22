'use client';

import { useState, useEffect } from 'react';
import { Wind } from '@phosphor-icons/react';
import { WeatherIcon } from '@/components/weather/weather-icon';
import { appContent } from '@/content/app';
import { getWeatherCondition } from '@/config/weather';
import { units } from '@/config/formatting';
import type { CurrentWeatherData } from '@/lib/weather/api';

const { weather: weatherContent } = appContent;

/**
 * Live weather widget for the home page.
 * Client component — uses browser geolocation to fetch current weather.
 */
export function CurrentWeather() {
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
          const res = await fetch(
            `/api/weather/current?lat=${latitude}&lon=${longitude}`,
          );
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
      { timeout: 10000, maximumAge: 1800000 },
    );
  }, []);

  if (loading) {
    return (
      <div className="flex h-[62px] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!weather || weather.temperature_c == null) return null;

  const condition = getWeatherCondition(weather.weather_code);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <WeatherIcon
        weatherCode={weather.weather_code}
        isDay={weather.is_day}
        className="size-8 text-muted-foreground"
      />

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-bold leading-tight text-foreground">
            {Math.round(weather.temperature_c)}{units.celsius}
          </span>
          <span className="text-sm text-muted-foreground">{condition.label}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {weather.feels_like_c != null && (
            <span>{weatherContent.feelsLike(Math.round(weather.feels_like_c))}</span>
          )}
          {weather.wind_speed_kmh != null && (
            <span className="flex items-center gap-0.5">
              <Wind className="size-3" />
              {Math.round(weather.wind_speed_kmh)}{units.kmh}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Weather integration configuration.
 * Thresholds, timing, and WMO condition code mappings (Open-Meteo).
 */

import { appContent } from '@/content/app';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Default POP threshold for triggering weather watch (0.0–1.0) */
export const DEFAULT_POP_THRESHOLD = 0.6;

/** POP threshold for severe weather escalation (0.0–1.0) */
export const SEVERE_POP_THRESHOLD = 0.9;

/** POP below this threshold is not shown on ride cards (0–100 integer %) */
export const POP_DISPLAY_THRESHOLD = 20;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/** Weather data older than this is considered stale (ms) */
export const WEATHER_STALE_THRESHOLD_MS = 3_600_000; // 1 hour

/** Check if a weather fetched_at timestamp is stale */
export function isWeatherDataStale(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > WEATHER_STALE_THRESHOLD_MS;
}

/** Maximum days ahead for forecast (Open-Meteo supports up to 16, we use 7) */
export const FORECAST_MAX_DAYS = 7;

/** Default timezone fallback when club timezone is unavailable */
export const DEFAULT_TIMEZONE = 'America/Toronto';

/** Geolocation request timeout (ms) */
export const GEOLOCATION_TIMEOUT_MS = 10_000;

/** Geolocation maximum cached position age (ms) — 30 minutes */
export const GEOLOCATION_MAX_AGE_MS = 1_800_000;

// ---------------------------------------------------------------------------
// Weather severity helper
// ---------------------------------------------------------------------------

export type WeatherSeverity = 'normal' | 'watch' | 'severe';

export function getWeatherSeverity(
  pop: number | null,
  threshold: number = DEFAULT_POP_THRESHOLD,
): WeatherSeverity {
  if (pop == null) return 'normal';
  if (pop >= SEVERE_POP_THRESHOLD) return 'severe';
  if (pop >= threshold) return 'watch';
  return 'normal';
}

/** Map weather severity to a Tailwind text color class */
export function getSeverityColorClass(severity: WeatherSeverity): string {
  if (severity === 'severe') return 'text-destructive';
  if (severity === 'watch') return 'text-warning';
  return 'text-muted-foreground';
}

/** Map WMO weather code + day/night to a condition color Tailwind class */
export function getConditionColorClass(
  weatherCode: number | null,
  isDay: boolean | null = true,
): string {
  if (weatherCode == null) return 'text-weather-overcast';
  if (weatherCode === 0) return isDay ? 'text-weather-clear' : 'text-weather-night';
  if (weatherCode <= 2) return isDay ? 'text-weather-clear' : 'text-weather-night';
  if (weatherCode === 3) return 'text-weather-overcast';
  if (weatherCode === 45 || weatherCode === 48) return 'text-weather-fog';
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82))
    return 'text-weather-rain';
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86))
    return 'text-weather-snow';
  if (weatherCode >= 95) return 'text-weather-thunder';
  return 'text-weather-overcast';
}

/**
 * Resolve the final icon color: condition color for normal severity,
 * severity color for watch/severe.
 */
export function getWeatherIconColorClass(
  weatherCode: number | null,
  isDay: boolean | null,
  severity: WeatherSeverity,
): string {
  if (severity === 'severe') return 'text-destructive';
  if (severity === 'watch') return 'text-warning';
  return getConditionColorClass(weatherCode, isDay);
}

// ---------------------------------------------------------------------------
// WMO condition code → Phosphor icon name mapping
// See https://open-meteo.com/en/docs → WMO Weather interpretation codes
// ---------------------------------------------------------------------------

export interface WeatherCondition {
  icon: string;
  label: string;
}

/**
 * Maps WMO weather condition codes to Phosphor icon component names
 * and human-readable labels (from content file).
 *
 *   0     = Clear sky
 *   1–3   = Mainly clear, partly cloudy, overcast
 *   45,48 = Fog
 *   51–57 = Drizzle
 *   61–67 = Rain
 *   71–77 = Snow
 *   80–82 = Rain showers
 *   85–86 = Snow showers
 *   95,96,99 = Thunderstorm
 */
export function getWeatherCondition(code: number | null): WeatherCondition {
  const { conditions } = appContent.weather;

  if (code == null) return { icon: 'Cloud', label: conditions.unknown };

  if (code === 0) return { icon: 'Sun', label: conditions.clear };
  if (code === 1) return { icon: 'CloudSun', label: conditions.mostlyClear };
  if (code === 2) return { icon: 'CloudSun', label: conditions.partlyCloudy };
  if (code === 3) return { icon: 'Cloud', label: conditions.overcast };
  if (code === 45 || code === 48) return { icon: 'CloudFog', label: conditions.fog };
  if (code >= 51 && code <= 57) return { icon: 'CloudRain', label: conditions.drizzle };
  if (code >= 61 && code <= 67) return { icon: 'CloudRain', label: conditions.rain };
  if (code >= 71 && code <= 77) return { icon: 'CloudSnow', label: conditions.snow };
  if (code >= 80 && code <= 82) return { icon: 'CloudRain', label: conditions.showers };
  if (code >= 85 && code <= 86) return { icon: 'CloudSnow', label: conditions.snowShowers };
  if (code >= 95) return { icon: 'CloudLightning', label: conditions.thunderstorm };

  return { icon: 'Cloud', label: conditions.unknown };
}

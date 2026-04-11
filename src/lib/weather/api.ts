import 'server-only';

import { getWeatherCondition } from '@/config/weather';

/**
 * Open-Meteo weather API client.
 * Server-only — never import in client components.
 *
 * Uses Open-Meteo's free API (no key required) with Environment Canada
 * (GEM) model data for accurate Canadian forecasts.
 */

// ---------------------------------------------------------------------------
// Open-Meteo response types
// ---------------------------------------------------------------------------

interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  is_day: number; // 0 or 1
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  relative_humidity_2m: number[];
  is_day: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
}

// ---------------------------------------------------------------------------
// Normalized output types (match DB shapes)
// ---------------------------------------------------------------------------

export interface CurrentWeatherData {
  temperature_c: number;
  feels_like_c: number;
  humidity: number;
  wind_speed_kmh: number;
  pop: number | null;
  weather_code: number;
  weather_main: string;
  weather_icon: string;
  is_day: boolean;
}

export interface RideForecastData {
  temperature_c: number;
  feels_like_c: number;
  humidity: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number | null;
  pop: number;
  precipitation_mm: number;
  weather_code: number;
  weather_main: string;
  weather_icon: string;
  is_day: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch current weather for a location.
 * Returns null on API failure (logs error).
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<CurrentWeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_gusts_10m',
        'is_day',
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timezone: 'auto',
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[weather] Open-Meteo current weather error:', res.status, await res.text());
      return null;
    }

    const data: OpenMeteoResponse = await res.json();
    const c = data.current;
    if (!c) return null;

    const isDay = c.is_day === 1;
    const condition = getWeatherCondition(c.weather_code);

    return {
      temperature_c: Math.round(c.temperature_2m),
      feels_like_c: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind_speed_kmh: round1(c.wind_speed_10m),
      pop: c.precipitation > 0 ? 1.0 : null,
      weather_code: c.weather_code,
      weather_main: condition.label,
      weather_icon: condition.icon,
      is_day: isDay,
    };
  } catch (error) {
    console.error('[weather] Failed to fetch current weather:', error);
    return null;
  }
}

/**
 * Fetch forecast for a specific ride date/time.
 * Finds the hourly slot matching the target datetime.
 * Returns null if the ride is beyond the forecast window or on API failure.
 */
export async function fetchForecastForRide(
  lat: number,
  lon: number,
  rideDate: string,
  rideTime: string,
  clubTimezone: string,
): Promise<RideForecastData | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: [
        'temperature_2m',
        'apparent_temperature',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_gusts_10m',
        'relative_humidity_2m',
        'is_day',
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timezone: clubTimezone,
      forecast_days: '7',
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[weather] Open-Meteo forecast error:', res.status, await res.text());
      return null;
    }

    const data: OpenMeteoResponse = await res.json();
    const h = data.hourly;
    if (!h || h.time.length === 0) return null;

    // Build target hour string: "2026-03-24T06:00"
    const rideHour = rideTime.slice(0, 2);
    const targetTime = `${rideDate}T${rideHour}:00`;

    // Find exact hourly match
    const idx = h.time.indexOf(targetTime);
    if (idx === -1) return null;

    const isDay = h.is_day[idx] === 1;

    const condition = getWeatherCondition(h.weather_code[idx]);

    return {
      temperature_c: Math.round(h.temperature_2m[idx]),
      feels_like_c: Math.round(h.apparent_temperature[idx]),
      humidity: h.relative_humidity_2m[idx],
      wind_speed_kmh: round1(h.wind_speed_10m[idx]),
      wind_gust_kmh: h.wind_gusts_10m[idx] != null ? round1(h.wind_gusts_10m[idx]) : null,
      pop: Math.round(h.precipitation_probability[idx]) / 100,
      precipitation_mm: round1(h.precipitation[idx]),
      weather_code: h.weather_code[idx],
      weather_main: condition.label,
      weather_icon: condition.icon,
      is_day: isDay,
    };
  } catch (error) {
    console.error('[weather] Failed to fetch forecast:', error);
    return null;
  }
}

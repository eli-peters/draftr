import 'server-only';
import { after } from 'next/server';

import { FORECAST_MAX_DAYS, isWeatherDataStale } from '@/config/weather';
import { syncWeatherForRide } from '@/lib/weather/sync';
import type { RideWeatherSnapshot } from '@/types/database';

/**
 * Lazy weather refresh — runs after the response is sent so reads aren't blocked.
 *
 * Why: the daily Vercel cron is unreliable on Hobby (1-hour fire window, no
 * retries, can silently miss invocations). Without a self-healing path, rides
 * can sit with no weather snapshot indefinitely. Every ride read schedules a
 * background refresh for any ride that's missing weather or stale (>1h old)
 * AND falls inside Open-Meteo's forecast window.
 *
 * Open-Meteo responses are cached at the fetch layer (revalidate: 1800), so
 * the per-process Set below is just a short-lived dedup against thundering-herd
 * within a single serverless instance.
 */

interface RefreshableRide {
  id: string;
  ride_date: string;
  start_latitude: number | string | null;
  start_longitude: number | string | null;
  ride_weather_snapshots?: RideWeatherSnapshot | null;
  weather?: RideWeatherSnapshot | null;
}

const inFlight = new Set<string>();
const IN_FLIGHT_TTL_MS = 60_000;

function shouldRefresh(ride: RefreshableRide, todayMs: number, maxMs: number): boolean {
  if (!ride.start_latitude || !ride.start_longitude) return false;

  const rideMs = Date.parse(`${ride.ride_date}T00:00:00`);
  if (!Number.isFinite(rideMs) || rideMs < todayMs || rideMs > maxMs) return false;

  const snapshot = ride.weather ?? ride.ride_weather_snapshots ?? null;
  if (!snapshot) return true;
  return isWeatherDataStale(snapshot.fetched_at);
}

/**
 * Schedule background weather refresh for any rides that need it.
 * Safe to call from query functions — `after()` defers work until the
 * response is flushed to the client.
 */
export function scheduleStaleWeatherRefresh(rides: RefreshableRide[]): void {
  if (rides.length === 0) return;

  const now = new Date();
  const todayMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00`);
  const maxMs = todayMs + FORECAST_MAX_DAYS * 86_400_000;

  const targets: string[] = [];
  for (const ride of rides) {
    if (!shouldRefresh(ride, todayMs, maxMs)) continue;
    if (inFlight.has(ride.id)) continue;
    inFlight.add(ride.id);
    targets.push(ride.id);
  }

  if (targets.length === 0) return;

  try {
    after(async () => {
      try {
        await Promise.all(targets.map((id) => syncWeatherForRide(id)));
      } finally {
        setTimeout(() => {
          for (const id of targets) inFlight.delete(id);
        }, IN_FLIGHT_TTL_MS).unref?.();
      }
    });
  } catch {
    // `after()` throws outside a request context (tests, scripts).
    // Fall back to fire-and-forget — best effort.
    Promise.all(targets.map((id) => syncWeatherForRide(id))).finally(() => {
      for (const id of targets) inFlight.delete(id);
    });
  }
}

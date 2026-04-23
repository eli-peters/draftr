import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchCurrentWeather, fetchForecastForRide } from '@/lib/weather/api';
import type { RideForecastData } from '@/lib/weather/api';
import { DEFAULT_POP_THRESHOLD, DEFAULT_TIMEZONE, FORECAST_MAX_DAYS } from '@/config/weather';
import { notifyWeatherWatchTransition } from '@/lib/weather/sync';

/**
 * Weather sync API route — called by Vercel Cron daily at 6 AM UTC.
 * Fetches weather data from Open-Meteo for upcoming rides and stores
 * it in Supabase. Also evaluates weather watch rules.
 *
 * Ride state logic:
 * - Future rides → forecast for ride date/time
 * - In-progress rides (today, started but not ended) → current weather at ride location
 * - Past rides (ended) → snapshot deleted, no badge shown
 *
 * POST /api/weather/sync
 */
export async function POST(request: Request) {
  // Validate cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { rides: 0, watchSet: 0, watchReverted: 0, cleaned: 0 };

  try {
    const now = new Date();
    // Use default timezone for date range query (good enough for single-tz MVP)
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
    const todayStr = [
      localNow.getFullYear(),
      (localNow.getMonth() + 1).toString().padStart(2, '0'),
      localNow.getDate().toString().padStart(2, '0'),
    ].join('-');
    const currentTimeStr = [
      localNow.getHours().toString().padStart(2, '0'),
      localNow.getMinutes().toString().padStart(2, '0'),
      localNow.getSeconds().toString().padStart(2, '0'),
    ].join(':');
    const maxLocalDate = new Date(localNow);
    maxLocalDate.setDate(maxLocalDate.getDate() + FORECAST_MAX_DAYS);
    const maxDateStr = [
      maxLocalDate.getFullYear(),
      (maxLocalDate.getMonth() + 1).toString().padStart(2, '0'),
      maxLocalDate.getDate().toString().padStart(2, '0'),
    ].join('-');

    // Fetch all upcoming rides (including today) with their start coordinates
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select(
        `
        id, title, ride_date, start_time, end_time, status, weather_watch_auto, club_id,
        start_latitude, start_longitude,
        club:clubs(timezone)
      `,
      )
      .gte('ride_date', todayStr)
      .lte('ride_date', maxDateStr)
      .in('status', ['scheduled', 'weather_watch']);

    if (ridesError) {
      console.error('[weather-sync] Failed to fetch rides:', ridesError);
      return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 });
    }

    if (!rides || rides.length === 0) {
      return NextResponse.json({ message: 'No upcoming rides to sync', results });
    }

    // Deduplicate API calls by location + time
    const forecastCache = new Map<string, Awaited<ReturnType<typeof fetchForecastForRide>>>();
    const currentCache = new Map<string, Awaited<ReturnType<typeof fetchCurrentWeather>>>();

    // Cache weather rules per club to avoid repeated queries
    const ruleCache = new Map<string, number>();

    for (const ride of rides) {
      // Skip rides without start coordinates
      if (!ride.start_latitude || !ride.start_longitude) continue;

      const lat = Number(ride.start_latitude);
      const lon = Number(ride.start_longitude);
      const club = ride.club as unknown as { timezone: string } | null;
      const timezone = club?.timezone ?? DEFAULT_TIMEZONE;
      const endTime = ride.end_time as string | null;

      // Determine ride state
      const isToday = ride.ride_date === todayStr;
      const hasStarted = isToday && ride.start_time <= currentTimeStr;
      const hasEnded = isToday && endTime != null && endTime <= currentTimeStr;

      // Past rides (ended today) → clean up snapshot, skip weather fetch
      if (hasEnded) {
        await supabase.from('ride_weather_snapshots').delete().eq('ride_id', ride.id);
        results.cleaned++;
        continue;
      }

      results.rides++;

      let forecast: RideForecastData | null = null;

      if (hasStarted) {
        // In-progress ride → use current weather at ride location
        const locKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        let current = currentCache.get(locKey);
        if (current === undefined) {
          current = await fetchCurrentWeather(lat, lon);
          currentCache.set(locKey, current);
        }
        if (current) {
          forecast = {
            ...current,
            pop: current.pop ?? 0,
            wind_gust_kmh: null,
            precipitation_mm: 0,
          } satisfies RideForecastData;
        }
      } else {
        // Future ride → use forecast for ride date/time
        const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}|${ride.ride_date}T${ride.start_time}`;
        const cached = forecastCache.get(cacheKey);
        if (cached !== undefined) {
          forecast = cached;
        } else {
          forecast = await fetchForecastForRide(
            lat,
            lon,
            ride.ride_date,
            ride.start_time,
            timezone,
          );
          forecastCache.set(cacheKey, forecast);
        }
      }

      if (forecast) {
        // Upsert weather snapshot
        await supabase.from('ride_weather_snapshots').upsert(
          {
            ride_id: ride.id,
            fetched_at: new Date().toISOString(),
            ...forecast,
          },
          { onConflict: 'ride_id' },
        );

        // Get the POP threshold for this ride's club
        let popThreshold = ruleCache.get(ride.club_id);
        if (popThreshold === undefined) {
          const { data: weatherRule } = await supabase
            .from('weather_rules')
            .select('rain_probability_threshold')
            .eq('club_id', ride.club_id)
            .eq('is_default', true)
            .maybeSingle();

          // DB stores threshold as percentage (e.g. 70), pop is 0.00–1.00
          popThreshold =
            weatherRule?.rain_probability_threshold != null
              ? weatherRule.rain_probability_threshold / 100
              : DEFAULT_POP_THRESHOLD;
          ruleCache.set(ride.club_id, popThreshold);
        }

        // Evaluate weather watch rules (only for future rides, not in-progress)
        if (!hasStarted) {
          if (forecast.pop >= popThreshold && ride.status === 'scheduled') {
            await supabase
              .from('rides')
              .update({ status: 'weather_watch', weather_watch_auto: true })
              .eq('id', ride.id);
            await notifyWeatherWatchTransition(ride.id, ride.title);
            results.watchSet++;
          } else if (
            forecast.pop < popThreshold &&
            ride.status === 'weather_watch' &&
            ride.weather_watch_auto
          ) {
            await supabase
              .from('rides')
              .update({ status: 'scheduled', weather_watch_auto: false })
              .eq('id', ride.id);
            results.watchReverted++;
          }
        }
      }
    }

    // Clean up snapshots for past rides (ride_date < today)
    const { data: pastRides } = await supabase.from('rides').select('id').lt('ride_date', todayStr);

    if (pastRides && pastRides.length > 0) {
      const pastIds = pastRides.map((r) => r.id);
      await supabase.from('ride_weather_snapshots').delete().in('ride_id', pastIds);
      results.cleaned += pastIds.length;
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[weather-sync] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

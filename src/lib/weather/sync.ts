import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { fetchForecastForRide } from '@/lib/weather/api';
import { DEFAULT_POP_THRESHOLD, DEFAULT_TIMEZONE } from '@/config/weather';

/**
 * Fetch and store weather for a single ride on-demand.
 * Called after ride creation/update so weather data is immediately available.
 *
 * Uses the admin client (bypasses RLS) — same pattern as the batch cron sync.
 * Swallows all errors so callers can fire-and-forget safely.
 */
export async function syncWeatherForRide(rideId: string): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Fetch ride with location coordinates and club timezone
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select(
        `
        id, ride_date, start_time, status, weather_watch_auto, club_id,
        meeting_location:meeting_locations(latitude, longitude),
        club:clubs(timezone)
      `,
      )
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      console.error('[weather] Failed to fetch ride for sync:', rideError);
      return;
    }

    const location = ride.meeting_location as unknown as {
      latitude: number | null;
      longitude: number | null;
    } | null;

    if (!location?.latitude || !location?.longitude) return;

    const club = ride.club as unknown as { timezone: string } | null;
    const timezone = club?.timezone ?? DEFAULT_TIMEZONE;

    const forecast = await fetchForecastForRide(
      location.latitude,
      location.longitude,
      ride.ride_date,
      ride.start_time,
      timezone,
    );

    if (!forecast) return;

    // Upsert weather snapshot
    await supabase.from('ride_weather_snapshots').upsert(
      {
        ride_id: ride.id,
        fetched_at: new Date().toISOString(),
        ...forecast,
      },
      { onConflict: 'ride_id' },
    );

    // Evaluate weather watch rules
    const { data: weatherRule } = await supabase
      .from('weather_rules')
      .select('rain_probability_threshold')
      .eq('club_id', ride.club_id)
      .eq('is_default', true)
      .maybeSingle();

    const popThreshold =
      weatherRule?.rain_probability_threshold != null
        ? weatherRule.rain_probability_threshold / 100
        : DEFAULT_POP_THRESHOLD;

    if (forecast.pop >= popThreshold && ride.status === 'scheduled') {
      await supabase
        .from('rides')
        .update({ status: 'weather_watch', weather_watch_auto: true })
        .eq('id', ride.id);
    } else if (
      forecast.pop < popThreshold &&
      ride.status === 'weather_watch' &&
      ride.weather_watch_auto
    ) {
      await supabase
        .from('rides')
        .update({ status: 'scheduled', weather_watch_auto: false })
        .eq('id', ride.id);
    }
  } catch (error) {
    console.error('[weather] Failed to sync weather for ride:', rideId, error);
  }
}

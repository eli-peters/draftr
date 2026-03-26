'use server';

interface WeatherSyncResult {
  success: boolean;
  message: string;
  results?: {
    rides: number;
    watchSet: number;
    watchReverted: number;
    cleaned: number;
  };
}

/**
 * Trigger a full weather sync for all upcoming rides.
 * Dev-only — mirrors what the Vercel Cron does in production.
 */
export async function devSyncWeather(): Promise<WeatherSyncResult> {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, message: 'Not available in production' };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { success: false, message: 'CRON_SECRET not set in .env.local' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/weather/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.error ?? `Sync failed (${res.status})` };
    }

    return {
      success: true,
      message: `Synced ${data.results?.rides ?? 0} rides`,
      results: data.results,
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

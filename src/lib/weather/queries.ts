import { createClient } from '@/lib/supabase/server';
import type { WeatherRule } from '@/types/database';

/**
 * Fetch the default weather rule for a club.
 */
export async function getClubWeatherRule(clubId: string): Promise<WeatherRule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('weather_rules')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[weather] Failed to fetch weather rule:', error);
    }
    return null;
  }

  return data;
}

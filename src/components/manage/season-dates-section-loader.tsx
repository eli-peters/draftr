import { createClient } from '@/lib/supabase/server';
import { SeasonDatesSection } from './season-dates-section';

/**
 * Async server component that independently fetches club season settings and
 * renders the SeasonDatesSection. Designed to be wrapped in a Suspense boundary
 * on the manage/settings page so it streams independently from pace tiers.
 */
export async function SeasonDatesSectionLoader({ clubId }: { clubId: string }) {
  const supabase = await createClient();
  const { data: club } = await supabase.from('clubs').select('settings').eq('id', clubId).single();

  const clubSettings = (club?.settings ?? {}) as Record<string, string>;

  return (
    <SeasonDatesSection
      clubId={clubId}
      seasonStart={clubSettings.season_start ?? ''}
      seasonEnd={clubSettings.season_end ?? ''}
    />
  );
}

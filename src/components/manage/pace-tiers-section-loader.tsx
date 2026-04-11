import { getPaceTiersWithUsage } from '@/lib/manage/queries';
import { PaceTiersSection } from './pace-tiers-section';

/**
 * Async server component that independently fetches pace tiers with usage
 * counts and renders the PaceTiersSection. Designed to be wrapped in a
 * Suspense boundary on the manage/settings page so it streams independently
 * from the season dates section.
 */
export async function PaceTiersSectionLoader({ clubId }: { clubId: string }) {
  const paceTiersWithUsage = await getPaceTiersWithUsage(clubId);
  return <PaceTiersSection clubId={clubId} initialTiers={paceTiersWithUsage} />;
}

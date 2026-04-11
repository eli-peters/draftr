import { getSectionCardStats } from '@/lib/manage/queries';
import { SectionCards } from '@/components/manage/section-cards';

interface SectionCardsSectionProps {
  clubId: string;
}

/**
 * Async server component — fetches section card stats independently so it
 * streams behind its own Suspense boundary without blocking the stats bento.
 */
export async function SectionCardsSection({ clubId }: SectionCardsSectionProps) {
  const stats = await getSectionCardStats(clubId);
  return <SectionCards stats={stats} clubId={clubId} />;
}

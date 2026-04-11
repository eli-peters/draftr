import { getAdminDashboardStats, getSectionCardStats } from '@/lib/manage/queries';
import { ManageStatsBento } from '@/components/manage/manage-stats-bento';

interface AdminStatsBentoSectionProps {
  clubId: string;
}

/**
 * Async server component — fetches admin bento stats independently so it can
 * stream behind its own Suspense boundary without blocking SectionCards.
 */
export async function AdminStatsBentoSection({ clubId }: AdminStatsBentoSectionProps) {
  const [stats, sectionStats] = await Promise.all([
    getAdminDashboardStats(clubId),
    getSectionCardStats(clubId),
  ]);

  return (
    <ManageStatsBento
      fillRate={stats.fillRate}
      fillRateChange={stats.fillRateChange}
      cancellationRate={stats.cancellationRate}
      cancellationsThisMonth={stats.cancellationsThisMonth}
      activeMembers={sectionStats.activeMembers}
    />
  );
}

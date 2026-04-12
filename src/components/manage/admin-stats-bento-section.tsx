import { getAdminDashboardStats } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { ManageStatsBento } from '@/components/manage/manage-stats-bento';

interface AdminStatsBentoSectionProps {
  clubId: string;
}

/**
 * Async server component — fetches admin bento stats independently so it can
 * stream behind its own Suspense boundary without blocking SectionCards.
 */
export async function AdminStatsBentoSection({ clubId }: AdminStatsBentoSectionProps) {
  const supabase = await createClient();
  const [stats, membersResult] = await Promise.all([
    getAdminDashboardStats(clubId),
    supabase
      .from('club_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'active'),
  ]);

  return (
    <ManageStatsBento
      fillRate={stats.fillRate}
      fillRateChange={stats.fillRateChange}
      cancellationRate={stats.cancellationRate}
      cancellationsThisMonth={stats.cancellationsThisMonth}
      activeMembers={membersResult.count ?? 0}
    />
  );
}

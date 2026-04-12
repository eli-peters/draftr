import { getLeaderDashboardStats } from '@/lib/manage/queries';
import { ManageStatsBento } from '@/components/manage/manage-stats-bento';
import { appContent } from '@/content/app';

const { stats } = appContent.manage.leaderHub;

interface LeaderStatsBentoSectionProps {
  userId: string;
  clubId: string;
}

/**
 * Async server component — fetches leader-scoped bento stats and renders them
 * using the same ManageStatsBento component as the admin dashboard.
 *
 * Stat mapping:
 *   fillRate        → leader's avg fill rate on their upcoming rides
 *   cancellationRate → signup cancellation rate on their recent rides
 *   activeMembers   → total rides led (repurposed slot, title overridden)
 */
export async function LeaderStatsBentoSection({ userId, clubId }: LeaderStatsBentoSectionProps) {
  const leaderStats = await getLeaderDashboardStats(userId, clubId);

  return (
    <ManageStatsBento
      fillRate={leaderStats.fillRate}
      fillRateChange={leaderStats.fillRateChange}
      cancellationRate={leaderStats.cancellationRate}
      cancellationsThisMonth={leaderStats.cancellationsThisMonth}
      activeMembers={leaderStats.ridesLed}
      labelOverrides={{
        fillRate: stats.fillRate,
        cancellationRate: stats.cancellationRate,
        activeMembers: stats.ridesLed,
        activeMembersContext: stats.ridesLedContext(leaderStats.ridesLed),
      }}
    />
  );
}

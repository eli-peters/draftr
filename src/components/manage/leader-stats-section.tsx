import { Bicycle, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { getLeaderHubStats } from '@/lib/manage/queries';
import { appContent } from '@/content/app';

const content = appContent.manage.leaderHub;

interface LeaderStatsSectionProps {
  userId: string;
  clubId: string;
}

export async function LeaderStatsSection({ userId, clubId }: LeaderStatsSectionProps) {
  const stats = await getLeaderHubStats(userId, clubId);

  return (
    <div className="flex items-center gap-3">
      <StatPill icon={Bicycle} label={content.statsRidesLed} value={stats.ridesLedCount} />
      <StatPill icon={UsersThree} label={content.statsTotalSignups} value={stats.totalSignups} />
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface-default px-3.5 py-2">
      <Icon weight="duotone" className="size-4 shrink-0 text-primary" />
      <span className="font-sans text-overline font-semibold text-foreground">{value}</span>
      <span className="font-sans text-overline text-muted-foreground">{label}</span>
    </div>
  );
}

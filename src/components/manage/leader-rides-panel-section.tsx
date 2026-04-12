import { getLeaderRides, getPaceGroups } from '@/lib/rides/queries';
import { ManageRidesPanel } from './manage-rides-panel';

interface LeaderRidesPanelSectionProps {
  userId: string;
  clubId: string;
}

/**
 * Async server component — fetches leader-scoped rides and pace groups,
 * then renders the same ManageRidesPanel used on the admin rides page.
 * isLeader=true hides the "Leader" column (all rides belong to this user).
 */
export async function LeaderRidesPanelSection({ userId, clubId }: LeaderRidesPanelSectionProps) {
  const [rides, paceGroups] = await Promise.all([
    getLeaderRides(userId, clubId, false),
    getPaceGroups(clubId),
  ]);

  return <ManageRidesPanel rides={rides} paceGroups={paceGroups} isLeader={true} />;
}

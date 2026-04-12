import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { getLeaderRides } from '@/lib/rides/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { LeaderRideCard } from './leader-ride-card';
import { appContent } from '@/content/app';

const content = appContent.manage.leaderHub;

interface LeaderRidesSectionProps {
  userId: string;
  clubId: string;
  timezone: string;
}

export async function LeaderRidesSection({ userId, clubId, timezone }: LeaderRidesSectionProps) {
  const rides = await getLeaderRides(userId, clubId, false);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = rides.filter((r) => r.ride_date >= today && r.status !== 'cancelled');
  const past = rides.filter((r) => r.ride_date < today || r.status === 'cancelled');

  return (
    <div className="space-y-card-stack">
      {/* Upcoming rides */}
      <section>
        <h2 className="mb-3 font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {content.upcomingSection}
        </h2>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={Bicycle}
            title={content.emptyTitle}
            description={content.emptyDescription}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((ride) => (
              <LeaderRideCard key={ride.id} ride={ride} timezone={timezone} />
            ))}
          </div>
        )}
      </section>

      {/* Past rides — collapsed by default */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {content.pastSection}
          </h2>
          <div className="space-y-3 opacity-60">
            {past.slice(0, 5).map((ride) => (
              <LeaderRideCard key={ride.id} ride={ride} timezone={timezone} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

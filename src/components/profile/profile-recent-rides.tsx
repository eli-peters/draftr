import Link from 'next/link';
import { format } from 'date-fns';
import { Bicycle, CaretRight, Path } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import { dateFormats, formatDistance } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RecentRide } from '@/lib/profile/queries';

const { profile: content } = appContent;

/**
 * ProfileRecentRides — the primary content column of the profile page.
 *
 * Uses the ContentCard icon+heading hero pattern (Outfit 24 SemiBold with a
 * centered duotone Bicycle above) to match the sidebar cards' visual system.
 * Inside the card, rides are rendered as a simple vertical list — title + a
 * muted date + pink distance row — with subtle dividers between rows.
 */
export function ProfileRecentRides({
  rides,
  distanceUnit = 'km',
}: {
  rides: RecentRide[];
  distanceUnit?: 'km' | 'mi';
}) {
  return (
    <ContentCard icon={Bicycle} heading={content.recentRides}>
      {rides.length === 0 ? (
        <p className="text-center text-base text-muted-foreground">{content.noRidesYet}</p>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle">
            {rides.map((ride, index) => (
              <li key={ride.id}>
                <RecentRideRow
                  ride={ride}
                  first={index === 0}
                  last={index === rides.length - 1}
                  distanceUnit={distanceUnit}
                />
              </li>
            ))}
          </ul>
          <Link
            href={routes.profileHistory}
            className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {content.history.viewAll}
            <CaretRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </ContentCard>
  );
}

function RecentRideRow({
  ride,
  first,
  last,
  distanceUnit,
}: {
  ride: RecentRide;
  first: boolean;
  last: boolean;
  distanceUnit: 'km' | 'mi';
}) {
  const rideDate = new Date(ride.ride_date);
  return (
    <Link
      href={routes.ride(ride.id)}
      className={`group flex items-center justify-between gap-4 transition-colors focus-ring ${first ? 'pb-3 pt-0' : last ? 'pb-0 pt-3' : 'py-3'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
          {ride.title}
        </p>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{format(rideDate, dateFormats.monthDay)}</span>
          {ride.distance_km != null && (
            <span className="inline-flex items-center gap-1 font-bold text-primary">
              <Path weight="regular" className="h-3.5 w-3.5" />
              {formatDistance(ride.distance_km, distanceUnit)}
            </span>
          )}
        </div>
      </div>
      <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
    </Link>
  );
}

import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Users, CaretRight, FlagBanner } from '@phosphor-icons/react/dist/ssr';
import { appContent } from '@/content/app';
import { dateFormats, separators } from '@/config/formatting';
import { routes } from '@/config/routes';

const { dashboard: content } = appContent;

interface LeadRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  signup_count: number;
  capacity: number | null;
  pace_group: string;
  location: string;
}

function LeadRideItem({ ride }: { ride: LeadRide }) {
  const capacityPercent = ride.capacity != null ? (ride.signup_count / ride.capacity) * 100 : 0;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <div className="rounded-xl border border-border bg-card p-5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{ride.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
                {separators.at}
                {ride.start_time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {ride.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {content.leader.signups(ride.signup_count)}
              </span>
            </div>
          </div>
          <CaretRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
        </div>
        {ride.capacity != null && (
          <div className="mt-4 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export function LeaderLeadsSection({ leads }: { leads: LeadRide[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {content.leader.yourLeads}
      </h2>
      {leads.length === 0 ? (
        <div className="py-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <FlagBanner weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">{content.leader.noLeads}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {content.leader.noLeadsDescription}
          </p>
        </div>
      ) : (
        <div>
          {leads.map((ride) => (
            <LeadRideItem key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </section>
  );
}

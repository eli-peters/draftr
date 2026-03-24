import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Users, CaretRight, FlagBanner } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
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
  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{ride.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
                {separators.at}
                {ride.start_time}
              </span>
              <MetadataItem icon={MapPin}>{ride.location}</MetadataItem>
              <MetadataItem icon={Users}>{content.leader.signups(ride.signup_count)}</MetadataItem>
            </div>
          </div>
          <CaretRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
        </div>
        <CapacityBar signupCount={ride.signup_count} capacity={ride.capacity} className="mt-4" />
      </Card>
    </Link>
  );
}

export function LeaderLeadsSection({ leads }: { leads: LeadRide[] }) {
  return (
    <section>
      <SectionHeading className="mb-4">{content.leader.yourLeads}</SectionHeading>
      {leads.length === 0 ? (
        <EmptyState
          title={content.leader.noLeads}
          description={content.leader.noLeadsDescription}
          icon={FlagBanner}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map((ride) => (
            <LeadRideItem key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </section>
  );
}

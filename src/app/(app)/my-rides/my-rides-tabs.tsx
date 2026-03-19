'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  MapPin,
  Path,
  Users,
  CaretRight,
  Bicycle,
  ClockCountdown,
  Queue,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { dateFormats, separators, units } from '@/config/formatting';
import type { UserRideSignup } from '@/lib/rides/queries';

const { myRides } = appContent;

function RideListItem({
  ride,
  variant = 'upcoming',
}: {
  ride: UserRideSignup;
  variant?: 'upcoming' | 'past' | 'waitlisted';
}) {
  const isPast = variant === 'past';
  const isWaitlisted = variant === 'waitlisted';
  const spotsText =
    ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : `${ride.signup_count}`;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <div
        className={`rounded-xl border border-border bg-card p-5 mb-3 ${isPast ? 'opacity-disabled' : ''}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isWaitlisted && ride.waitlist_position != null && (
              <Badge variant="warning" className="text-sm">
                {myRides.waitlistPosition(ride.waitlist_position)}
              </Badge>
            )}
            <CaretRight weight="bold" className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
          {ride.pace_group_name && `${separators.dot}${ride.pace_group_name}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {ride.meeting_location_name && (
            <span className="flex items-center gap-1.5">
              <MapPin weight="fill" className="h-3.5 w-3.5" />
              {ride.meeting_location_name}
            </span>
          )}
          {ride.distance_km != null && (
            <span className="flex items-center gap-1.5 text-info">
              <Path weight="bold" className="h-3.5 w-3.5" />
              {ride.distance_km}
              {units.km}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users weight="fill" className="h-3.5 w-3.5" />
            {spotsText}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  description,
  cta,
  icon: Icon,
}: {
  title: string;
  description: string;
  cta?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
      {Icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
          <Icon weight="duotone" className="h-10 w-10 text-primary/60" />
        </div>
      )}
      <p className={`${Icon ? 'mt-4' : ''} text-lg font-semibold text-foreground`}>{title}</p>
      <p className="mt-2 text-base text-muted-foreground max-w-80">{description}</p>
      {cta && (
        <Link href={routes.rides} className="mt-4">
          <Button size="sm">{cta}</Button>
        </Link>
      )}
    </div>
  );
}

interface MyRidesTabsProps {
  upcoming: UserRideSignup[];
  past: UserRideSignup[];
  waitlisted: UserRideSignup[];
}

export function MyRidesTabs({ upcoming, past, waitlisted }: MyRidesTabsProps) {
  return (
    <Tabs defaultValue="upcoming" className="mt-6">
      <TabsList className="w-full">
        <TabsTrigger value="upcoming">{myRides.tabs.upcoming}</TabsTrigger>
        <TabsTrigger value="past">{myRides.tabs.past}</TabsTrigger>
        <TabsTrigger value="waitlisted">{myRides.tabs.waitlisted}</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {upcoming.length === 0 ? (
          <EmptyState
            title={myRides.emptyState.upcoming.title}
            description={myRides.emptyState.upcoming.description}
            cta={myRides.emptyState.upcoming.cta}
            icon={Bicycle}
          />
        ) : (
          <div className="mt-4">
            {upcoming.map((ride) => (
              <RideListItem key={ride.id} ride={ride} variant="upcoming" />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        {past.length === 0 ? (
          <EmptyState
            title={myRides.emptyState.past.title}
            description={myRides.emptyState.past.description}
            icon={ClockCountdown}
          />
        ) : (
          <div className="mt-4">
            {past.map((ride) => (
              <RideListItem key={ride.id} ride={ride} variant="past" />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="waitlisted">
        {waitlisted.length === 0 ? (
          <EmptyState
            title={myRides.emptyState.waitlisted.title}
            description={myRides.emptyState.waitlisted.description}
            icon={Queue}
          />
        ) : (
          <div className="mt-4">
            {waitlisted.map((ride) => (
              <RideListItem key={ride.id} ride={ride} variant="waitlisted" />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

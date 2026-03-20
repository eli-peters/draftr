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
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetadataItem } from '@/components/ui/metadata-item';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
      <Card className={cn('p-5 mb-3', isPast && 'opacity-disabled')}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isWaitlisted && ride.waitlist_position != null && (
              <Badge variant="warning" className="text-sm">
                {myRides.waitlistPosition(ride.waitlist_position)}
              </Badge>
            )}
            <CaretRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
          {ride.pace_group_name && `${separators.dot}${ride.pace_group_name}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {ride.meeting_location_name && (
            <MetadataItem icon={MapPin}>{ride.meeting_location_name}</MetadataItem>
          )}
          {ride.distance_km != null && (
            <MetadataItem icon={Path} className="text-info">
              {ride.distance_km}
              {units.km}
            </MetadataItem>
          )}
          <MetadataItem icon={Users}>{spotsText}</MetadataItem>
        </div>
      </Card>
    </Link>
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
            icon={Bicycle}
            className="mt-12"
          >
            <Link href={routes.rides} className="mt-4">
              <Button size="sm">{myRides.emptyState.upcoming.cta}</Button>
            </Link>
          </EmptyState>
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
            className="mt-12"
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
            className="mt-12"
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

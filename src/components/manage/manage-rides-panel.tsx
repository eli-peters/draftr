'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Users, CloudRain, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterChip, FilterChipGroup } from '@/components/ui/filter-chip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { filterRides } from '@/lib/rides/sort';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { RideStatus } from '@/config/statuses';
import { dateFormats, separators, formatTime, getPaceBadgeVariant } from '@/config/formatting';

const { manage: content, rides: ridesContent } = appContent;

export interface ManageRideData {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  status: string;
  capacity: number | null;
  distance_km: number | null;
  template_id: string | null;
  meeting_location_name: string | null;
  pace_group_id: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  signup_count: number;
  created_by_name: string | null;
}

// ---------------------------------------------------------------------------
// ManageRideRow — desktop table row / mobile stacked card
// ---------------------------------------------------------------------------

function ManageRideRow({ ride }: { ride: ManageRideData }) {
  const isCancelled = ride.status === RideStatus.CANCELLED;
  const isWeatherWatch = ride.status === RideStatus.WEATHER_WATCH;
  const spotsText =
    ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : `${ride.signup_count}`;

  return (
    <Link
      href={routes.manageEditRide(ride.id, routes.manage)}
      className={cn(
        'group block border-b border-border last:border-b-0',
        isCancelled && 'opacity-disabled',
      )}
    >
      {/* Desktop: table row */}
      <div className="hidden items-center gap-3 px-4 py-3 md:flex">
        {/* Date/Time — fixed width */}
        <div className="w-36 shrink-0 text-sm text-muted-foreground">
          {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
          {separators.at}
          {formatTime(ride.start_time)}
        </div>

        {/* Title + status badges — flex-1 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{ride.title}</span>
          {ride.template_id && (
            <ArrowsClockwise className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
          {isWeatherWatch && (
            <Badge variant="warning" size="sm" className="shrink-0 gap-1">
              <CloudRain className="h-3 w-3" />
              {ridesContent.status.weatherWatch}
            </Badge>
          )}
          {isCancelled && (
            <Badge variant="destructive" size="sm" className="shrink-0">
              {ridesContent.status.cancelled}
            </Badge>
          )}
        </div>

        {/* Pace — fixed width */}
        <div className="w-24 shrink-0">
          {ride.pace_group_name && (
            <Badge
              variant={
                ride.pace_group_sort_order
                  ? getPaceBadgeVariant(ride.pace_group_sort_order)
                  : 'secondary'
              }
              size="sm"
            >
              {ride.pace_group_name}
            </Badge>
          )}
        </div>

        {/* Spots — fixed width */}
        <div className="flex w-20 shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          <span>{spotsText}</span>
        </div>

        {/* Location — fixed width, truncated */}
        <div className="w-32 shrink-0 truncate text-sm text-muted-foreground">
          {ride.meeting_location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{ride.meeting_location_name}</span>
            </span>
          )}
        </div>

        {/* Leader — fixed width */}
        <div className="w-28 shrink-0 truncate text-sm text-muted-foreground/60">
          {ride.created_by_name}
        </div>
      </div>

      {/* Mobile: stacked compact layout */}
      <div className="flex flex-col gap-2 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{ride.title}</span>
            {ride.template_id && (
              <ArrowsClockwise className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isWeatherWatch && (
              <Badge variant="warning" size="sm" className="gap-1">
                <CloudRain className="h-3 w-3" />
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="destructive" size="sm">
                {ridesContent.status.cancelled}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
            {separators.at}
            {formatTime(ride.start_time)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3 shrink-0" />
            {spotsText}
          </span>
          {ride.meeting_location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{ride.meeting_location_name}</span>
            </span>
          )}
          {ride.pace_group_name && (
            <Badge
              variant={
                ride.pace_group_sort_order
                  ? getPaceBadgeVariant(ride.pace_group_sort_order)
                  : 'secondary'
              }
              size="sm"
            >
              {ride.pace_group_name}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Table header (desktop only)
// ---------------------------------------------------------------------------

function ManageTableHeader() {
  return (
    <div className="hidden border-b border-border bg-surface-sunken px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:flex items-center gap-3">
      <div className="w-36 shrink-0">{appContent.rides.form.date}</div>
      <div className="min-w-0 flex-1">{appContent.rides.form.title}</div>
      <div className="w-24 shrink-0">{appContent.rides.form.paceGroup}</div>
      <div className="w-20 shrink-0">{appContent.rides.card.riders}</div>
      <div className="w-32 shrink-0">{appContent.rides.form.meetingLocation}</div>
      <div className="w-28 shrink-0">{content.rides.leaderColumn}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RideList
// ---------------------------------------------------------------------------

function RideList({ rides, emptyMessage }: { rides: ManageRideData[]; emptyMessage: string }) {
  if (rides.length === 0) {
    return <p className="mt-6 text-center text-base text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <Card className="mt-4 overflow-clip p-0">
      <ManageTableHeader />
      {rides.map((ride) => (
        <ManageRideRow key={ride.id} ride={ride} />
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ManageRidesPanel
// ---------------------------------------------------------------------------

interface ManageRidesPanelProps {
  rides: ManageRideData[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  initialPaceFilter?: string | null;
}

export function ManageRidesPanel({
  rides,
  paceGroups,
  initialPaceFilter = null,
}: ManageRidesPanelProps) {
  const [activePaceIds, setActivePaceIds] = useState<string[]>(
    initialPaceFilter ? [initialPaceFilter] : [],
  );
  const [activeTab, setActiveTab] = useState('upcoming');

  const today = new Date().toISOString().split('T')[0];

  const filtered = filterRides(rides, activePaceIds);

  const upcomingRides = filtered.filter(
    (r) => r.ride_date >= today && r.status !== RideStatus.CANCELLED,
  );
  const pastRides = filtered.filter(
    (r) => r.ride_date < today && r.status !== RideStatus.CANCELLED,
  );
  const cancelledRides = filtered.filter((r) => r.status === RideStatus.CANCELLED);

  const hasFilter = activePaceIds.length > 0;

  const ridesByTab: Record<string, typeof upcomingRides> = {
    upcoming: upcomingRides,
    past: pastRides,
    cancelled: cancelledRides,
  };
  const visibleRides = ridesByTab[activeTab] ?? upcomingRides;

  return (
    <div className="mt-4">
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">{content.rides.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{content.rides.past}</TabsTrigger>
          <TabsTrigger value="cancelled">{content.rides.cancelled}</TabsTrigger>
        </TabsList>

        {paceGroups.length > 0 && (
          <FilterChipGroup
            multiple
            value={activePaceIds}
            onValueChange={setActivePaceIds}
            className="mt-6"
          >
            {paceGroups.map((pg) => (
              <FilterChip key={pg.id} value={pg.id} label={pg.name} />
            ))}
          </FilterChipGroup>
        )}

        <TabsContent value="upcoming">
          <RideList rides={upcomingRides} emptyMessage={content.rides.noUpcomingRides} />
        </TabsContent>

        <TabsContent value="past">
          <RideList rides={pastRides} emptyMessage={content.rides.noPastRides} />
        </TabsContent>

        <TabsContent value="cancelled">
          <RideList rides={cancelledRides} emptyMessage={content.rides.noCancelledRides} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

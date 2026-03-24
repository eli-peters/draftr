'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MapPin, Users, CaretRight, CloudRain, ArrowsClockwise, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RideFilterDrawer, type SortOption } from '@/components/rides/ride-filter-drawer';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import { sortRides } from '@/lib/rides/sort';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { RideStatus } from '@/config/statuses';
import { dateFormats, separators } from '@/config/formatting';

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
  tags: { id: string; name: string }[];
  signup_count: number;
  created_by_name: string | null;
}

function ManageRideItem({ ride }: { ride: ManageRideData }) {
  const isCancelled = ride.status === RideStatus.CANCELLED;

  return (
    <Link href={routes.manageEditRide(ride.id)} className="block group">
      <Card className={cn('p-5 mb-3', isCancelled && 'opacity-disabled')}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
              {ride.template_id && (
                <ArrowsClockwise className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
              {ride.status === RideStatus.WEATHER_WATCH && (
                <Badge variant="warning" className="shrink-0 text-sm gap-1">
                  <CloudRain className="h-3.5 w-3.5" />
                  {ridesContent.status.weatherWatch}
                </Badge>
              )}
              {isCancelled && (
                <Badge variant="destructive" className="shrink-0 text-sm">
                  {ridesContent.status.cancelled}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span>
                {format(new Date(ride.ride_date), dateFormats.dayMonthDay)}
                {separators.at}
                {ride.start_time.slice(0, 5)}
              </span>
              {ride.meeting_location_name && (
                <MetadataItem icon={MapPin}>{ride.meeting_location_name}</MetadataItem>
              )}
              <MetadataItem icon={Users}>
                {ride.capacity != null
                  ? `${ride.signup_count}/${ride.capacity}`
                  : ride.signup_count}
              </MetadataItem>
            </div>
            {ride.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {ride.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag.id} variant="secondary" size="sm">
                    {tag.name}
                  </Badge>
                ))}
                {ride.tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    {ridesContent.card.moreTags(ride.tags.length - 2)}
                  </span>
                )}
              </div>
            )}
            {ride.created_by_name && (
              <p className="mt-1.5 text-sm text-muted-foreground/60">
                {content.rides.createdBy(ride.created_by_name)}
              </p>
            )}
          </div>
          <CaretRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
        </div>
        {!isCancelled && (
          <CapacityBar signupCount={ride.signup_count} capacity={ride.capacity} className="mt-4" />
        )}
      </Card>
    </Link>
  );
}

interface ManageRidesPanelProps {
  rides: ManageRideData[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
  initialPaceFilter?: string[];
}

function RideList({ rides, emptyMessage }: { rides: ManageRideData[]; emptyMessage: string }) {
  if (rides.length === 0) {
    return <p className="mt-6 text-center text-base text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="mt-4">
      {rides.map((ride) => (
        <ManageRideItem key={ride.id} ride={ride} />
      ))}
    </div>
  );
}

export function ManageRidesPanel({ rides, paceGroups, tags, initialPaceFilter = [] }: ManageRidesPanelProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [paceIds, setPaceIds] = useState<string[]>(initialPaceFilter);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const today = new Date().toISOString().split('T')[0];

  // Apply filters
  const filtered = rides.filter((r) => {
    if (paceIds.length > 0 && (!r.pace_group_id || !paceIds.includes(r.pace_group_id)))
      return false;
    if (tagIds.length > 0 && !r.tags.some((t) => tagIds.includes(t.id))) return false;
    return true;
  });

  const sorted = sortRides(filtered, sortBy);

  // Split into categories
  const upcomingRides = sorted.filter(
    (r) => r.ride_date >= today && r.status !== RideStatus.CANCELLED,
  );
  const pastRides = sorted.filter((r) => r.ride_date < today && r.status !== RideStatus.CANCELLED);
  const cancelledRides = sorted.filter((r) => r.status === RideStatus.CANCELLED);

  const [activeTab, setActiveTab] = useState('upcoming');

  const activeCount = paceIds.length + tagIds.length;
  const hasFilters = activeCount > 0 || sortBy !== 'date_asc';

  const ridesByTab: Record<string, typeof upcomingRides> = {
    upcoming: upcomingRides,
    past: pastRides,
    cancelled: cancelledRides,
  };
  const visibleRides = ridesByTab[activeTab] ?? upcomingRides;

  function handleApply(newPaceIds: string[], newTagIds: string[], newSort: SortOption) {
    setPaceIds(newPaceIds);
    setTagIds(newTagIds);
    setSortBy(newSort);
  }

  function handleClear() {
    setPaceIds([]);
    setTagIds([]);
    setSortBy('date_asc');
  }

  return (
    <div className="mt-4">
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">{content.rides.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{content.rides.past}</TabsTrigger>
          <TabsTrigger value="cancelled">{content.rides.cancelled}</TabsTrigger>
        </TabsList>

        <ContentToolbar
          left={
            <span className="text-sm text-muted-foreground">
              {hasFilters
                ? ridesContent.filter.showingCount(visibleRides.length)
                : ridesContent.filter.totalCount(visibleRides.length)}
            </span>
          }
          right={
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label={ridesContent.feed.refreshLabel}
              >
                <ArrowClockwise className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <RideFilterDrawer
                paceGroups={paceGroups}
                tags={tags}
                activePaceGroupIds={paceIds}
                activeTagIds={tagIds}

                activeSort={sortBy}
                onApply={handleApply}
                onClear={handleClear}
              />
            </>
          }
          className="mt-3"
        />

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

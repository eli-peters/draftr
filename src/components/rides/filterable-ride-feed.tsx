'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { Bicycle, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { RideCard } from '@/components/rides/ride-card';
import {
  RideFilterSheet,
  type SortOption,
  type DateRange,
} from '@/components/rides/ride-filter-sheet';
import { sortRides } from '@/lib/rides/sort';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

interface FilterableRideFeedProps {
  rides: RideWithDetails[];
  paceGroups: { id: string; name: string }[];
  tags: { id: string; name: string; color: string | null }[];
  heading?: string;
  emptyTitle: string;
  emptyDescription: string;
  cardVariant?: 'home' | 'rides';
}

export function FilterableRideFeed({
  rides,
  paceGroups,
  tags,
  heading,
  emptyTitle,
  emptyDescription,
  cardVariant = 'rides',
}: FilterableRideFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, startTransition] = useTransition();

  const paceIds = searchParams.get('pace')?.split(',').filter(Boolean) ?? [];
  const tagIds = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';
  const dateRange: DateRange = { from: dateFrom, to: dateTo };
  const sortBy = (searchParams.get('sort') as SortOption) ?? 'date_asc';
  const activeCount = paceIds.length + tagIds.length + (dateFrom || dateTo ? 1 : 0);
  const hasFilters = activeCount > 0;

  const filtered = rides.filter((ride) => {
    if (paceIds.length > 0 && (!ride.pace_group || !paceIds.includes(ride.pace_group.id)))
      return false;
    if (tagIds.length > 0 && !ride.tags.some((t) => tagIds.includes(t.id))) return false;
    if (dateFrom && ride.ride_date < dateFrom) return false;
    if (dateTo && ride.ride_date > dateTo) return false;
    return true;
  });

  const sorted = sortRides(filtered, sortBy);

  function handleApply(
    newPaceIds: string[],
    newTagIds: string[],
    newDateRange: DateRange,
    newSort: SortOption,
  ) {
    const params = new URLSearchParams();
    if (newPaceIds.length > 0) params.set('pace', newPaceIds.join(','));
    if (newTagIds.length > 0) params.set('tags', newTagIds.join(','));
    if (newDateRange.from) params.set('from', newDateRange.from);
    if (newDateRange.to) params.set('to', newDateRange.to);
    if (newSort !== 'date_asc') params.set('sort', newSort);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  function handleClear() {
    router.replace(pathname, { scroll: false });
  }

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          {heading && <SectionHeading>{heading}</SectionHeading>}
          {hasFilters && sorted.length > 0 && (
            <span className="text-xs text-muted-foreground/70">
              {ridesContent.filter.showingCount(sorted.length)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh rides"
          >
            <ArrowClockwise className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <RideFilterSheet
            paceGroups={paceGroups}
            tags={tags}
            activePaceGroupIds={paceIds}
            activeTagIds={tagIds}
            activeDateRange={dateRange}
            activeSort={sortBy}
            onApply={handleApply}
            onClear={handleClear}
          />
        </div>
      </div>

      {sorted.length > 0 ? (
        <div className="flex flex-col gap-4">
          {sorted.map((ride) => (
            <RideCard key={ride.id} ride={ride} variant={cardVariant} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? ridesContent.filter.noResults.title : emptyTitle}
          description={hasFilters ? ridesContent.filter.noResults.description : emptyDescription}
          icon={Bicycle}
          className="mt-12"
        />
      )}
    </section>
  );
}

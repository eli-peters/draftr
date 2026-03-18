'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { Bicycle, ArrowClockwise } from '@phosphor-icons/react';
import { RideCard } from '@/components/rides/ride-card';
import { RideFilterSheet, type SortOption } from '@/components/rides/ride-filter-sheet';
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
}

function sortRides(rides: RideWithDetails[], sortBy: SortOption): RideWithDetails[] {
  return [...rides].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.ride_date.localeCompare(b.ride_date) || a.start_time.localeCompare(b.start_time);
      case 'date_desc':
        return b.ride_date.localeCompare(a.ride_date) || b.start_time.localeCompare(a.start_time);
      case 'distance_asc':
        return (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity);
      case 'distance_desc':
        return (b.distance_km ?? 0) - (a.distance_km ?? 0);
      default:
        return 0;
    }
  });
}

export function FilterableRideFeed({
  rides,
  paceGroups,
  tags,
  heading,
  emptyTitle,
  emptyDescription,
}: FilterableRideFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, startTransition] = useTransition();

  const paceIds = searchParams.get('pace')?.split(',').filter(Boolean) ?? [];
  const tagIds = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const sortBy = (searchParams.get('sort') as SortOption) || 'date_asc';
  const activeCount = paceIds.length + tagIds.length;
  const hasFilters = activeCount > 0;

  const filtered = rides.filter((ride) => {
    if (paceIds.length > 0 && (!ride.pace_group || !paceIds.includes(ride.pace_group.id)))
      return false;
    if (tagIds.length > 0 && !ride.tags.some((t) => tagIds.includes(t.id))) return false;
    return true;
  });

  const sorted = sortRides(filtered, sortBy);

  function handleApply(newPaceIds: string[], newTagIds: string[], newSort: SortOption) {
    const params = new URLSearchParams();
    if (newPaceIds.length > 0) params.set('pace', newPaceIds.join(','));
    if (newTagIds.length > 0) params.set('tags', newTagIds.join(','));
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
          {heading && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {heading}
            </h2>
          )}
          {hasFilters && sorted.length > 0 && (
            <span className="text-xs text-muted-foreground/70">
              {ridesContent.filter.showingCount(sorted.length)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Refresh rides"
          >
            <ArrowClockwise
              weight="bold"
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <RideFilterSheet
            paceGroups={paceGroups}
            tags={tags}
            activePaceGroupIds={paceIds}
            activeTagIds={tagIds}
            activeSort={sortBy}
            onApply={handleApply}
            onClear={handleClear}
          />
        </div>
      </div>

      {sorted.length > 0 ? (
        <div>
          {sorted.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {hasFilters ? ridesContent.filter.noResults.title : emptyTitle}
          </h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">
            {hasFilters ? ridesContent.filter.noResults.description : emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}

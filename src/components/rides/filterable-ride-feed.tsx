'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { Bicycle, ArrowClockwise, X } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { RideCard } from '@/components/rides/ride-card';
import { RideFilterDrawer, type SortOption } from '@/components/rides/ride-filter-drawer';
import { filterRides, sortRides } from '@/lib/rides/sort';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

const MIN_PACE_TIER = 1;
const MAX_PACE_TIER = 8;

interface FilterableRideFeedProps {
  rides: RideWithDetails[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  heading?: string;
  emptyTitle: string;
  emptyDescription: string;
  cardVariant?: 'home' | 'rides';
}

export function FilterableRideFeed({
  rides,
  paceGroups,
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
  const sortBy = (searchParams.get('sort') as SortOption) ?? 'date_asc';
  const hasFilters = paceIds.length > 0;

  const filtered = filterRides(rides, paceIds);

  const sorted = sortRides(filtered, sortBy);

  function handleApply(newPaceIds: string[], _newTagIds: string[], newSort: SortOption) {
    const params = new URLSearchParams();
    if (newPaceIds.length > 0) params.set('pace', newPaceIds.join(','));
    if (newSort !== 'date_asc') params.set('sort', newSort);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  function handleClear() {
    router.replace(pathname, { scroll: false });
  }

  function dismissFilter(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = paceIds.filter((p) => p !== id);
    if (remaining.length > 0) {
      params.set('pace', remaining.join(','));
    } else {
      params.delete('pace');
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <section>
      <ContentToolbar
        left={
          <>
            {heading && <SectionHeading>{heading}</SectionHeading>}
            <span className="text-sm text-muted-foreground">
              {hasFilters
                ? ridesContent.filter.showingCount(sorted.length)
                : ridesContent.filter.totalCount(rides.length)}
            </span>
          </>
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
              activePaceGroupIds={paceIds}
              activeSort={sortBy}
              onApply={handleApply}
              onClear={handleClear}
            />
          </>
        }
        className="mb-4"
      />

      {hasFilters && (
        <div className="mb-3 flex flex-wrap gap-2">
          {paceIds.map((id) => {
            const pg = paceGroups.find((p) => p.id === id);
            if (!pg) return null;
            return (
              <Badge
                key={id}
                variant={
                  `pace-${Math.min(Math.max(pg.sort_order, MIN_PACE_TIER), MAX_PACE_TIER)}` as BadgeVariant
                }
                className="cursor-pointer gap-1"
                onClick={() => dismissFilter(id)}
              >
                {pg.name}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}

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

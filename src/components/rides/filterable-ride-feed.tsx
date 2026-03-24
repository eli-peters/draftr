'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { Bicycle, ArrowClockwise, X } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import { Badge } from '@/components/ui/badge';
import { RideCard } from '@/components/rides/ride-card';
import { RideFilterDrawer, type SortOption } from '@/components/rides/ride-filter-drawer';
import { sortRides } from '@/lib/rides/sort';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

interface FilterableRideFeedProps {
  rides: RideWithDetails[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
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
  const sortBy = (searchParams.get('sort') as SortOption) ?? 'date_asc';
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

  function dismissFilter(type: 'pace' | 'tag', id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'pace') {
      const remaining = paceIds.filter((p) => p !== id);
      remaining.length > 0 ? params.set('pace', remaining.join(',')) : params.delete('pace');
    } else if (type === 'tag') {
      const remaining = tagIds.filter((t) => t !== id);
      remaining.length > 0 ? params.set('tags', remaining.join(',')) : params.delete('tags');
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
              tags={tags}
              activePaceGroupIds={paceIds}
              activeTagIds={tagIds}
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
                variant={`pace-${Math.min(Math.max(pg.sort_order, 1), 8)}` as import('@/components/ui/badge').BadgeVariant}
                className="cursor-pointer gap-1"
                onClick={() => dismissFilter('pace', id)}
              >
                {pg.name}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {tagIds.map((id) => {
            const tag = tags.find((t) => t.id === id);
            if (!tag) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() => dismissFilter('tag', id)}
              >
                {tag.name}
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

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Bicycle } from '@phosphor-icons/react';
import { RideCard } from '@/components/rides/ride-card';
import { RideFilterSheet } from '@/components/rides/ride-filter-sheet';
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

  const paceIds = searchParams.get('pace')?.split(',').filter(Boolean) ?? [];
  const tagIds = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const activeCount = paceIds.length + tagIds.length;
  const hasFilters = activeCount > 0;

  const filtered = rides.filter((ride) => {
    if (paceIds.length > 0 && (!ride.pace_group || !paceIds.includes(ride.pace_group.id)))
      return false;
    if (tagIds.length > 0 && !ride.tags.some((t) => tagIds.includes(t.id))) return false;
    return true;
  });

  function handleApply(newPaceIds: string[], newTagIds: string[]) {
    const params = new URLSearchParams();
    if (newPaceIds.length > 0) params.set('pace', newPaceIds.join(','));
    if (newTagIds.length > 0) params.set('tags', newTagIds.join(','));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  function handleClear() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        {heading && (
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </h2>
        )}
        <RideFilterSheet
          paceGroups={paceGroups}
          tags={tags}
          activePaceGroupIds={paceIds}
          activeTagIds={tagIds}
          onApply={handleApply}
          onClear={handleClear}
        />
      </div>

      {filtered.length > 0 ? (
        <div>
          {filtered.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      ) : hasFilters ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {ridesContent.filter.noResults.title}
          </h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">
            {ridesContent.filter.noResults.description}
          </p>
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

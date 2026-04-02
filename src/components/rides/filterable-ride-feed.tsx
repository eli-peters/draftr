'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import { RideCard } from '@/components/rides/ride-card';
import { RideFilterBar } from '@/components/rides/ride-filter-bar';
import { filterRides } from '@/lib/rides/sort';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

interface FilterableRideFeedProps {
  rides: RideWithDetails[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  toolbarLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  cardVariant?: 'home' | 'rides';
  timezone: string;
}

export function FilterableRideFeed({
  rides,
  paceGroups,
  toolbarLabel,
  emptyTitle,
  emptyDescription,
  cardVariant = 'rides',
  timezone,
}: FilterableRideFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activePaceIds = searchParams.getAll('pace');
  const hasFilter = activePaceIds.length > 0;

  const filtered = filterRides(rides, activePaceIds);

  function handleChangePace(ids: string[]) {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append('pace', id));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  return (
    <section>
      <ContentToolbar
        left={
          <SectionHeading as="span">
            {hasFilter ? ridesContent.filter.filteredCount(filtered.length) : toolbarLabel}
          </SectionHeading>
        }
        right={
          paceGroups.length > 0 ? (
            <RideFilterBar
              paceGroups={paceGroups}
              activePaceIds={activePaceIds}
              onChangePace={handleChangePace}
            />
          ) : undefined
        }
        className="mb-4"
      />

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-5">
          {filtered.map((ride) => (
            <RideCard key={ride.id} ride={ride} variant={cardVariant} timezone={timezone} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={hasFilter ? ridesContent.filter.noResults.title : emptyTitle}
          description={hasFilter ? ridesContent.filter.noResults.description : emptyDescription}
          icon={Bicycle}
          className="mt-12"
        />
      )}
    </section>
  );
}

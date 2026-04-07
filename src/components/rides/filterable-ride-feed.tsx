'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChip, FilterChipGroup } from '@/components/ui/filter-chip';
import { RideCard } from '@/components/rides/ride-card';
import { filterRides } from '@/lib/rides/sort';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

interface FilterableRideFeedProps {
  rides: RideWithDetails[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  emptyTitle: string;
  emptyDescription: string;
  cardVariant?: 'home' | 'rides';
  timezone: string;
}

export function FilterableRideFeed({
  rides,
  paceGroups,
  emptyTitle,
  emptyDescription,
  cardVariant = 'rides',
  timezone,
}: FilterableRideFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();

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
      {paceGroups.length > 0 && (
        <FilterChipGroup
          multiple
          value={activePaceIds}
          onValueChange={handleChangePace}
          className="mt-2 mb-6 md:mt-0 md:mb-8"
        >
          {paceGroups.map((pg) => (
            <FilterChip key={pg.id} value={pg.id} label={pg.name} />
          ))}
        </FilterChipGroup>
      )}

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((ride) => (
              <motion.div
                key={ride.id}
                layout
                initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: DURATIONS.normal, ease: EASE.out },
                }}
                exit={
                  shouldReduce
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        x: -16,
                        transition: { duration: DURATIONS.fast, ease: EASE.out },
                      }
                }
              >
                <RideCard ride={ride} variant={cardVariant} timezone={timezone} />
              </motion.div>
            ))}
          </AnimatePresence>
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

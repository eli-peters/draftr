'use client';

import { CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { FilterChip, FilterChipGroup } from '@/components/ui/filter-chip';
import { appContent } from '@/content/app';

const { calendar: calendarContent } = appContent;

interface CalendarFiltersProps {
  paceGroups: { id: string; name: string; sort_order: number }[];
  activePaceIds: string[];
  signedUpOnly: boolean;
  onPaceChange: (ids: string[]) => void;
  onSignedUpChange: (value: boolean) => void;
}

export function CalendarFilters({
  paceGroups,
  activePaceIds,
  signedUpOnly,
  onPaceChange,
  onSignedUpChange,
}: CalendarFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-1">
      {/* Pace group chips — multi-select */}
      {paceGroups.length > 0 && (
        <FilterChipGroup
          multiple
          value={activePaceIds}
          onValueChange={onPaceChange}
          className="w-auto gap-2"
        >
          {paceGroups.map((pg) => (
            <FilterChip key={pg.id} value={pg.id} label={pg.name} />
          ))}
        </FilterChipGroup>
      )}

      {/* "Signed up" toggle — standalone multi-group (toggling one item) */}
      <FilterChipGroup
        multiple
        value={signedUpOnly ? ['signed-up'] : []}
        onValueChange={(vals: string[]) => onSignedUpChange(vals.includes('signed-up'))}
        className="w-auto"
      >
        <FilterChip value="signed-up" label={calendarContent.signedUpFilter} icon={CheckCircle} />
      </FilterChipGroup>
    </div>
  );
}

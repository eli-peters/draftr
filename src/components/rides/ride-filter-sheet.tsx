'use client';

import { useEffect, useState } from 'react';
import { FunnelSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { appContent } from '@/content/app';
import { RideFilterContent } from './ride-filter-content';
import type { SortOption, DateRange } from './ride-filter-content';

export type { SortOption, DateRange };

const { rides: ridesContent } = appContent;

interface RideFilterSheetProps {
  paceGroups: { id: string; name: string }[];
  tags: { id: string; name: string; color: string | null }[];
  activePaceGroupIds: string[];
  activeTagIds: string[];
  activeDateRange: DateRange;
  activeSort: SortOption;
  onApply: (
    paceGroupIds: string[],
    tagIds: string[],
    dateRange: DateRange,
    sort: SortOption,
  ) => void;
  onClear: () => void;
}

export function RideFilterSheet({
  paceGroups,
  tags,
  activePaceGroupIds,
  activeTagIds,
  activeDateRange,
  activeSort,
  onApply,
  onClear,
}: RideFilterSheetProps) {
  const isMobile = useIsMobile();

  // Defer Base UI Dialog to client-only to prevent hydration ID mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [pendingPaceGroups, setPendingPaceGroups] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>({ from: '', to: '' });
  const [pendingSort, setPendingSort] = useState<SortOption>('date_asc');

  const activeCount =
    activePaceGroupIds.length +
    activeTagIds.length +
    (activeDateRange.from || activeDateRange.to ? 1 : 0);

  const hasActiveFilters =
    pendingPaceGroups.length > 0 ||
    pendingTags.length > 0 ||
    pendingDateRange.from !== '' ||
    pendingDateRange.to !== '' ||
    pendingSort !== 'date_asc';

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPendingPaceGroups(activePaceGroupIds);
      setPendingTags(activeTagIds);
      setPendingDateRange(activeDateRange);
      setPendingSort(activeSort);
    }
    setOpen(nextOpen);
  }

  function togglePaceGroup(id: string) {
    setPendingPaceGroups((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function toggleTag(id: string) {
    setPendingTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function handleApply() {
    onApply(pendingPaceGroups, pendingTags, pendingDateRange, pendingSort);
    setOpen(false);
  }

  function handleClear() {
    onClear();
    setOpen(false);
  }

  return (
    <>
      <Button
        variant={activeCount > 0 ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        <FunnelSimple className="h-4 w-4" />
        {ridesContent.filter.button}
        {activeCount > 0 && (
          <Badge variant="outline" size="sm" className="ml-1">
            {ridesContent.filter.activeCount(activeCount)}
          </Badge>
        )}
      </Button>

      {mounted && (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent
            side={isMobile ? 'bottom' : 'right'}
            className={
              isMobile
                ? 'flex max-h-(--sheet-height-lg) flex-col'
                : 'flex w-(--sheet-width-sidebar) flex-col'
            }
          >
            {/* Header with title and clear action */}
            <SheetHeader className="flex-row items-center justify-between">
              <SheetTitle>{ridesContent.filter.heading}</SheetTitle>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={handleClear}>
                  {ridesContent.filter.clearAll}
                </Button>
              )}
            </SheetHeader>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto">
              <RideFilterContent
                paceGroups={paceGroups}
                tags={tags}
                pendingPaceGroups={pendingPaceGroups}
                pendingTags={pendingTags}
                pendingDateRange={pendingDateRange}
                pendingSort={pendingSort}
                onTogglePaceGroup={togglePaceGroup}
                onToggleTag={toggleTag}
                onDateRangeChange={setPendingDateRange}
                onSortChange={setPendingSort}
              />
            </div>

            {/* Footer with apply button */}
            <SheetFooter className="border-t border-border pt-3">
              <Button className="w-full" onClick={handleApply}>
                {ridesContent.filter.apply}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

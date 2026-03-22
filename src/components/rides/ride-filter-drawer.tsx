'use client';

import { useEffect, useState } from 'react';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { appContent } from '@/content/app';
import { RideFilterContent } from './ride-filter-content';
import type { SortOption, DateRange } from './ride-filter-content';

export type { SortOption, DateRange };

const { rides: ridesContent } = appContent;

interface RideFilterDrawerProps {
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
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

export function RideFilterDrawer({
  paceGroups,
  tags,
  activePaceGroupIds,
  activeTagIds,
  activeDateRange,
  activeSort,
  onApply,
  onClear,
}: RideFilterDrawerProps) {
  const isMobile = useIsMobile();

  // Defer to client-only to prevent hydration mismatch
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
        <Drawer
          open={open}
          onOpenChange={handleOpenChange}
          direction={isMobile ? 'bottom' : 'right'}
        >
          <DrawerContent
            className={isMobile ? 'max-h-(--drawer-height-lg)' : 'w-(--drawer-width-sidebar)'}
          >
            {/* Header with title and clear action */}
            <DrawerHeader className="flex-row items-center justify-between">
              <DrawerTitle>{ridesContent.filter.heading}</DrawerTitle>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={handleClear}>
                  {ridesContent.filter.clearAll}
                </Button>
              )}
            </DrawerHeader>

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
            <DrawerFooter className="border-t border-border pt-3">
              <Button className="w-full" onClick={handleApply}>
                {ridesContent.filter.apply}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

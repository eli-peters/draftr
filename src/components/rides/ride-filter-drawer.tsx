'use client';

import { useEffect, useState } from 'react';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

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
import type { SortOption } from './ride-filter-content';

export type { SortOption };

const { rides: ridesContent } = appContent;

interface RideFilterDrawerProps {
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
  activePaceGroupIds: string[];
  activeTagIds: string[];
  activeSort: SortOption;
  onApply: (paceGroupIds: string[], tagIds: string[], sort: SortOption) => void;
  onClear: () => void;
}

export function RideFilterDrawer({
  paceGroups,
  tags,
  activePaceGroupIds,
  activeTagIds,
  activeSort,
  onApply,
  onClear,
}: RideFilterDrawerProps) {
  const isMobile = useIsMobile();

  // Defer to client-only to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [pendingPaceGroups, setPendingPaceGroups] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [pendingSort, setPendingSort] = useState<SortOption>('date_asc');

  const activeCount = activePaceGroupIds.length + activeTagIds.length;

  const hasActiveFilters =
    pendingPaceGroups.length > 0 || pendingTags.length > 0 || pendingSort !== 'date_asc';

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPendingPaceGroups(activePaceGroupIds);
      setPendingTags(activeTagIds);
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
    onApply(pendingPaceGroups, pendingTags, pendingSort);
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
          <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-medium text-primary-foreground">
            {ridesContent.filter.activeCount(activeCount)}
          </span>
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
            {/* Header */}
            <DrawerHeader className="text-left">
              <DrawerTitle>{ridesContent.filter.heading}</DrawerTitle>
            </DrawerHeader>

            {/* Scrollable filter content */}
            <div className="min-w-0 flex-1 overflow-y-auto">
              <RideFilterContent
                paceGroups={paceGroups}
                tags={tags}
                pendingPaceGroups={pendingPaceGroups}
                pendingTags={pendingTags}
                pendingSort={pendingSort}
                onTogglePaceGroup={togglePaceGroup}
                onToggleTag={toggleTag}
                onSortChange={setPendingSort}
              />
            </div>

            {/* Footer with clear + apply actions */}
            <DrawerFooter className="flex-row gap-3 border-t border-border pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!hasActiveFilters}
                onClick={handleClear}
              >
                {ridesContent.filter.clearAll}
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                {ridesContent.filter.apply}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

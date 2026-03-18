'use client';

import { useState } from 'react';
import { FunnelSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from '@/components/ui/sheet';
import { appContent } from '@/content/app';

const { rides: ridesContent } = appContent;

export type SortOption = 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date_asc', label: ridesContent.filter.sort.dateAsc },
  { value: 'date_desc', label: ridesContent.filter.sort.dateDesc },
  { value: 'distance_asc', label: ridesContent.filter.sort.distanceAsc },
  { value: 'distance_desc', label: ridesContent.filter.sort.distanceDesc },
];

interface RideFilterSheetProps {
  paceGroups: { id: string; name: string }[];
  tags: { id: string; name: string; color: string | null }[];
  activePaceGroupIds: string[];
  activeTagIds: string[];
  activeSort: SortOption;
  onApply: (paceGroupIds: string[], tagIds: string[], sort: SortOption) => void;
  onClear: () => void;
}

export function RideFilterSheet({
  paceGroups,
  tags,
  activePaceGroupIds,
  activeTagIds,
  activeSort,
  onApply,
  onClear,
}: RideFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [pendingPaceGroups, setPendingPaceGroups] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [pendingSort, setPendingSort] = useState<SortOption>('date_asc');

  const activeCount = activePaceGroupIds.length + activeTagIds.length;

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
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <FunnelSimple weight="bold" className="h-4 w-4" />
        {ridesContent.filter.button}
        {activeCount > 0 && (
          <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
            {ridesContent.filter.activeCount(activeCount)}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{ridesContent.filter.heading}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 px-4">
            {/* Pace Groups */}
            {paceGroups.length > 0 && (
              <div className="space-y-2">
                <Label>{ridesContent.filter.paceGroupLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {paceGroups.map((pg) => {
                    const isSelected = pendingPaceGroups.includes(pg.id);
                    return (
                      <Badge
                        key={pg.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer text-sm px-3 py-1"
                        onClick={() => togglePaceGroup(pg.id)}
                      >
                        {pg.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>{ridesContent.filter.tagsLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = pendingTags.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer text-sm px-3 py-1"
                        style={
                          isSelected && tag.color
                            ? {
                                backgroundColor: tag.color,
                                color: '#fff',
                                borderColor: tag.color,
                              }
                            : tag.color
                              ? {
                                  borderColor: `${tag.color}60`,
                                  color: tag.color,
                                }
                              : undefined
                        }
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="space-y-2">
              <Label>{ridesContent.filter.sortLabel}</Label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={pendingSort === opt.value ? 'default' : 'outline'}
                    className="cursor-pointer text-sm px-3 py-1"
                    onClick={() => setPendingSort(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3">
            {(pendingPaceGroups.length > 0 || pendingTags.length > 0 || pendingSort !== 'date_asc') && (
              <Button variant="ghost" className="flex-1" onClick={handleClear}>
                {ridesContent.filter.clearAll}
              </Button>
            )}
            <Button className="flex-1" onClick={handleApply}>
              {ridesContent.filter.apply}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

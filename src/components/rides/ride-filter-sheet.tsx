'use client';

import { useState } from 'react';
import { FunnelSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

export interface DateRange {
  from: string;
  to: string;
}

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
  const [open, setOpen] = useState(false);
  const [pendingPaceGroups, setPendingPaceGroups] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>({ from: '', to: '' });
  const [pendingSort, setPendingSort] = useState<SortOption>('date_asc');

  const activeCount =
    activePaceGroupIds.length +
    activeTagIds.length +
    (activeDateRange.from || activeDateRange.to ? 1 : 0);

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
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <FunnelSimple className="h-4 w-4" />
        {ridesContent.filter.button}
        {activeCount > 0 && (
          <Badge variant="default" size="sm" className="ml-1">
            {ridesContent.filter.activeCount(activeCount)}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-(--sheet-height-md) overflow-y-auto">
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
                        size="lg"
                        className="cursor-pointer"
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
                        size="lg"
                        className="cursor-pointer"
                        style={
                          isSelected && tag.color
                            ? {
                                backgroundColor: tag.color,
                                color: 'var(--primary-foreground)',
                                borderColor: tag.color,
                              }
                            : tag.color
                              ? {
                                  borderColor: `color-mix(in srgb, ${tag.color} 60%, transparent)`,
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

            {/* Date Range */}
            <div className="space-y-2">
              <Label>{ridesContent.filter.dateRangeLabel}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {ridesContent.filter.dateFrom}
                  </span>
                  <Input
                    type="date"
                    value={pendingDateRange.from}
                    onChange={(e) =>
                      setPendingDateRange((prev) => ({ ...prev, from: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {ridesContent.filter.dateTo}
                  </span>
                  <Input
                    type="date"
                    value={pendingDateRange.to}
                    onChange={(e) =>
                      setPendingDateRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label>{ridesContent.filter.sortLabel}</Label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={pendingSort === opt.value ? 'default' : 'outline'}
                    size="lg"
                    className="cursor-pointer"
                    onClick={() => setPendingSort(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3">
            {(pendingPaceGroups.length > 0 ||
              pendingTags.length > 0 ||
              pendingDateRange.from ||
              pendingDateRange.to ||
              pendingSort !== 'date_asc') && (
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

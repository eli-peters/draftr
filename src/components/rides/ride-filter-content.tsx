'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface RideFilterContentProps {
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
  pendingPaceGroups: string[];
  pendingTags: string[];
  pendingDateRange: DateRange;
  pendingSort: SortOption;
  onTogglePaceGroup: (id: string) => void;
  onToggleTag: (id: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  onSortChange: (sort: SortOption) => void;
}

export function RideFilterContent({
  paceGroups,
  tags,
  pendingPaceGroups,
  pendingTags,
  pendingDateRange,
  pendingSort,
  onTogglePaceGroup,
  onToggleTag,
  onDateRangeChange,
  onSortChange,
}: RideFilterContentProps) {
  return (
    <div className="divide-y divide-border">
      {/* Pace Groups */}
      {paceGroups.length > 0 && (
        <div className="space-y-2 px-4 py-4">
          <Label>
            {ridesContent.filter.paceGroupLabel}
            {pendingPaceGroups.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-2">
                {pendingPaceGroups.length}
              </Badge>
            )}
          </Label>
          <div className="flex flex-wrap gap-2">
            {paceGroups.map((pg) => {
              const isSelected = pendingPaceGroups.includes(pg.id);
              const paceVariant = `pace-${Math.min(Math.max(pg.sort_order, 1), 8)}` as import('@/components/ui/badge').BadgeVariant;
              return (
                <Badge
                  key={pg.id}
                  variant={isSelected ? paceVariant : 'outline'}
                  size="lg"
                  className="cursor-pointer"
                  onClick={() => onTogglePaceGroup(pg.id)}
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
        <div className="space-y-2 px-4 py-4">
          <Label>
            {ridesContent.filter.tagsLabel}
            {pendingTags.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-2">
                {pendingTags.length}
              </Badge>
            )}
          </Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = pendingTags.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="lg"
                  className="cursor-pointer"
                  onClick={() => onToggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="space-y-2 px-4 py-4">
        <Label>{ridesContent.filter.dateRangeLabel}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{ridesContent.filter.dateFrom}</span>
            <Input
              type="date"
              value={pendingDateRange.from}
              onChange={(e) => onDateRangeChange({ ...pendingDateRange, from: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{ridesContent.filter.dateTo}</span>
            <Input
              type="date"
              value={pendingDateRange.to}
              onChange={(e) => onDateRangeChange({ ...pendingDateRange, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2 px-4 py-4">
        <Label className="text-muted-foreground">{ridesContent.filter.sortLabel}</Label>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant={pendingSort === opt.value ? 'default' : 'outline'}
              size="lg"
              className="cursor-pointer"
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

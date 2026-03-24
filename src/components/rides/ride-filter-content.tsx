'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';

const { rides: ridesContent } = appContent;

export type SortOption = 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date_asc', label: ridesContent.filter.sort.dateAsc },
  { value: 'date_desc', label: ridesContent.filter.sort.dateDesc },
  { value: 'distance_asc', label: ridesContent.filter.sort.distanceAsc },
  { value: 'distance_desc', label: ridesContent.filter.sort.distanceDesc },
];

interface RideFilterContentProps {
  isMobile: boolean;
  paceGroups: { id: string; name: string; sort_order: number }[];
  tags: { id: string; name: string }[];
  pendingPaceGroups: string[];
  pendingTags: string[];
  pendingSort: SortOption;
  onTogglePaceGroup: (id: string) => void;
  onToggleTag: (id: string) => void;
  onSortChange: (sort: SortOption) => void;
}

const sectionLabelClass = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const unselectedClass = 'cursor-pointer text-foreground';
const selectedClass = 'cursor-pointer';

function SectionDivider() {
  return <div className="mx-4 border-b border-border" />;
}

export function RideFilterContent({
  isMobile,
  paceGroups,
  tags,
  pendingPaceGroups,
  pendingTags,
  pendingSort,
  onTogglePaceGroup,
  onToggleTag,
  onSortChange,
}: RideFilterContentProps) {
  return (
    <div>
      {/* Pace Groups */}
      {paceGroups.length > 0 && (
        <>
          <div className="space-y-3 px-4 py-5">
            <Label className={sectionLabelClass}>
              {ridesContent.filter.paceGroupLabel}
              <Badge
                variant="secondary"
                size="sm"
                className={cn('ml-2', pendingPaceGroups.length === 0 && 'invisible')}
              >
                {pendingPaceGroups.length}
              </Badge>
            </Label>
            <div className="flex flex-wrap gap-2">
              {paceGroups.map((pg) => {
                const isSelected = pendingPaceGroups.includes(pg.id);
                return (
                  <Badge
                    key={pg.id}
                    variant={isSelected ? 'tag-selected' : 'vibe'}
                    size="lg"
                    className={isSelected ? selectedClass : unselectedClass}
                    onClick={() => onTogglePaceGroup(pg.id)}
                  >
                    {pg.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <SectionDivider />
        </>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <>
          <div className="space-y-3 px-4 py-5">
            <Label className={sectionLabelClass}>
              {ridesContent.filter.tagsLabel}
              <Badge
                variant="secondary"
                size="sm"
                className={cn('ml-2', pendingTags.length === 0 && 'invisible')}
              >
                {pendingTags.length}
              </Badge>
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {tags.map((tag) => {
                const isSelected = pendingTags.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'tag-selected' : 'vibe'}
                    size="lg"
                    className={isSelected ? selectedClass : unselectedClass}
                    onClick={() => onToggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <SectionDivider />
        </>
      )}

      {/* Sort */}
      <div className="space-y-3 px-4 py-5">
        <Label className={sectionLabelClass}>{ridesContent.filter.sortLabel}</Label>
        <div className="grid grid-cols-2 gap-2">
          {sortOptions.map((opt) => {
            const isSelected = pendingSort === opt.value;
            return (
              <Badge
                key={opt.value}
                variant={isSelected ? 'tag-selected' : 'vibe'}
                size="lg"
                className={
                  isSelected
                    ? 'cursor-pointer justify-center text-center'
                    : 'cursor-pointer justify-center text-center text-foreground'
                }
                onClick={() => onSortChange(opt.value)}
              >
                {opt.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

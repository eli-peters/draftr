'use client';

import { FunnelSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';

const { rides: ridesContent } = appContent;

interface RideFilterBarProps {
  paceGroups: { id: string; name: string; sort_order: number }[];
  activePaceIds: string[];
  onChangePace: (ids: string[]) => void;
  className?: string;
}

export function RideFilterBar({
  paceGroups,
  activePaceIds,
  onChangePace,
  className,
}: RideFilterBarProps) {
  const hasFilter = activePaceIds.length > 0;

  function togglePace(id: string) {
    const isSelected = activePaceIds.includes(id);
    let next: string[];

    if (isSelected) {
      next = activePaceIds.filter((p) => p !== id);
    } else {
      next = [...activePaceIds, id];
    }

    // If all selected, clear filter (same as no filter)
    if (next.length === paceGroups.length) {
      next = [];
    }

    onChangePace(next);
  }

  return (
    <div className={cn('flex items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'relative rounded-full transition-transform active:scale-90',
                hasFilter
                  ? 'bg-primary text-primary-foreground hover:bg-action-primary-hover'
                  : 'text-muted-foreground hover:text-primary hover:bg-action-primary-subtle-bg',
              )}
              aria-label={ridesContent.filter.paceLabel}
            >
              <FunnelSimple className="size-6" />
              {hasFilter && (
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary-foreground ring-2 ring-background" />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{ridesContent.filter.paceLabel}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {paceGroups.map((pg) => (
            <DropdownMenuCheckboxItem
              key={pg.id}
              checked={activePaceIds.includes(pg.id)}
              onCheckedChange={() => togglePace(pg.id)}
            >
              {pg.name}
            </DropdownMenuCheckboxItem>
          ))}
          {hasFilter && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangePace([])}>
                {ridesContent.filter.clearFilter}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

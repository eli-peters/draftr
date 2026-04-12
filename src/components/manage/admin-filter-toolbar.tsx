'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, X, Plus, Funnel } from '@phosphor-icons/react/dist/ssr';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { appContent } from '@/content/app';

const { manage: manageContent } = appContent;

export interface FilterDefinition {
  /** Unique key used as the filter identifier. */
  key: string;
  /** Display label for the filter dimension. */
  label: string;
  /** The value considered "default" (no filter active). */
  defaultValue: string;
  /** Options for the dropdown. */
  options: { value: string; label: string }[];
}

interface AdminFilterToolbarProps {
  /** Filter dropdown definitions. */
  filters: FilterDefinition[];
  /** Current filter values keyed by filter key. */
  filterValues: Record<string, string>;
  /** Called when a filter dropdown value changes. */
  onFilterChange: (key: string, value: string) => void;
  /** Current search query. */
  search?: string;
  /** Called with debounced search value. */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Debounce delay in ms (default 200). */
  debounceMs?: number;
}

/**
 * Reusable filter toolbar with "+ Add filter" pattern.
 * Filters start hidden. Clicking "+ Add filter" shows available dimensions.
 * Active filters appear as chips with a value dropdown and X to remove.
 * Search input is always visible.
 */
export function AdminFilterToolbar({
  filters,
  filterValues,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder,
  debounceMs = 200,
}: AdminFilterToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search ?? '');
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(() => {
    // Auto-show filters that are already set to non-default values
    return filters
      .filter((f) => filterValues[f.key] !== undefined && filterValues[f.key] !== f.defaultValue)
      .map((f) => f.key);
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchChange?.(value);
      }, debounceMs);
    },
    [onSearchChange, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Filters available to add (not yet active)
  const availableFilters = filters.filter((f) => !activeFilterKeys.includes(f.key));
  // Filters currently shown as chips
  const activeFilters = filters.filter((f) => activeFilterKeys.includes(f.key));

  function addFilter(key: string) {
    setActiveFilterKeys((prev) => [...prev, key]);
  }

  function removeFilter(key: string) {
    setActiveFilterKeys((prev) => prev.filter((k) => k !== key));
    // Reset to default value
    const def = filters.find((f) => f.key === key);
    if (def) onFilterChange(key, def.defaultValue);
  }

  return (
    <div className="flex flex-row flex-wrap gap-10 items-center">
      {/* Search input — flex on mobile, fixed width on desktop */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-24 md:flex-none md:order-last md:ml-auto">
          <MagnifyingGlass className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
            placeholder={searchPlaceholder ?? ''}
            className="h-8 w-full pl-7 pr-7 text-xs md:w-48"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map((filter) => (
          <div
            key={filter.key}
            className="flex items-center gap-1 rounded-md border border-(--border-subtle) bg-(--surface-default) pl-2.5 pr-1 py-0.5"
          >
            <span className="text-xs font-medium text-(--text-tertiary)">{filter.label}</span>
            <Select
              size="sm"
              value={filterValues[filter.key] ?? filter.defaultValue}
              onValueChange={(v) => onFilterChange(filter.key, v)}
              items={Object.fromEntries(filter.options.map((o) => [o.value, o.label]))}
            >
              <SelectTrigger className="h-6 w-auto min-w-16 border-0 bg-transparent px-1 text-xs font-medium text-(--text-primary)">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => removeFilter(filter.key)}
              className="rounded p-0.5 text-(--text-tertiary) hover:bg-muted/50 hover:text-(--text-primary)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* + Add filter button */}
        {availableFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-(--border-default) bg-(--surface-default) px-2.5 py-1.5 text-xs font-medium text-(--text-secondary) hover:bg-(--surface-sunken) hover:border-(--border-strong) hover:text-(--text-primary)">
              <Funnel className="h-3.5 w-3.5" />
              {manageContent.addFilter}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableFilters.map((filter) => (
                <DropdownMenuItem key={filter.key} onClick={() => addFilter(filter.key)}>
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

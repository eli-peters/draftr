'use client';

import { useMemo, useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { appContent } from '@/content/app';

const { manage: manageContent } = appContent;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

interface TablePaginationProps {
  /** Total number of items. */
  totalItems: number;
  /** Current page (0-indexed). */
  page: number;
  /** Items per page. */
  pageSize: number;
  /** Called when the page changes. */
  onPageChange: (page: number) => void;
  /** Called when page size changes. */
  onPageSizeChange: (size: number) => void;
}

/**
 * Table footer pagination: rows-per-page selector, row count, page navigation.
 */
export function TablePagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push('ellipsis');
      const rangeStart = Math.max(1, page - 1);
      const rangeEnd = Math.min(totalPages - 2, page + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
      if (page < totalPages - 3) pages.push('ellipsis');
      pages.push(totalPages - 1);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-(--border-subtle) px-3 py-2">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-(--text-tertiary)">{manageContent.rowsPerPage}</span>
        <Select
          size="sm"
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v));
            onPageChange(0);
          }}
          items={Object.fromEntries(PAGE_SIZE_OPTIONS.map((n) => [String(n), String(n)]))}
        >
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row count */}
      <span className="font-sans text-xs text-(--text-tertiary)">
        {start}–{end} {manageContent.paginationOf} {totalItems}
      </span>

      {/* Page navigation */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
        >
          <CaretDoubleLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          <CaretLeft className="h-3.5 w-3.5" />
        </Button>

        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-xs text-(--text-tertiary)">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'outline' : 'ghost'}
              size="icon-sm"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          <CaretRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
        >
          <CaretDoubleRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook to manage pagination state. Returns paginated slice + pagination props.
 */
export function usePagination<T>(items: T[], defaultPageSize = 15) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = items.length;
  const paginatedItems = items.slice(page * pageSize, (page + 1) * pageSize);

  // Reset to first page when items change significantly
  const safeSetPage = (p: number) => {
    const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
    setPage(Math.min(p, maxPage));
  };

  return {
    paginatedItems,
    paginationProps: {
      totalItems,
      page,
      pageSize,
      onPageChange: safeSetPage,
      onPageSizeChange: setPageSize,
    },
  };
}

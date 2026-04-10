'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CaretUp, CaretDown, DotsThree } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminFilterToolbar, type FilterDefinition } from './admin-filter-toolbar';
import { TablePagination } from './table-pagination';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { RideStatus } from '@/config/statuses';
import { formatTime, getPaceBadgeVariant } from '@/config/formatting';
import { cancelRide } from '@/lib/rides/actions';

const { manage: content, rides: ridesContent, common } = appContent;

export interface ManageRideData {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  status: string;
  capacity: number | null;
  distance_km: number | null;
  template_id: string | null;
  start_location_name: string | null;
  pace_group_id: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  signup_count: number;
  created_by_name: string | null;
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type RideSortKey = 'date' | 'title' | 'pace' | 'spots' | 'location' | 'leader';
type SortDir = 'asc' | 'desc';

function compareRides(
  a: ManageRideData,
  b: ManageRideData,
  key: RideSortKey,
  dir: SortDir,
): number {
  const m = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'date': {
      const cmp =
        a.ride_date.localeCompare(b.ride_date) || a.start_time.localeCompare(b.start_time);
      return cmp * m;
    }
    case 'title':
      return a.title.localeCompare(b.title) * m;
    case 'pace':
      return ((a.pace_group_sort_order ?? 999) - (b.pace_group_sort_order ?? 999)) * m;
    case 'spots':
      return (a.signup_count - b.signup_count) * m;
    case 'location':
      return (a.start_location_name ?? '').localeCompare(b.start_location_name ?? '') * m;
    case 'leader':
      return (a.created_by_name ?? '').localeCompare(b.created_by_name ?? '') * m;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// SortableHeader
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: RideSortKey;
  currentKey: RideSortKey;
  currentDir: SortDir;
  onSort: (key: RideSortKey) => void;
}) {
  const isActive = sortKey === currentKey;
  return (
    <th
      className="cursor-pointer select-none p-3 text-overline font-mono text-(--text-secondary) hover:text-(--text-primary)"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive &&
          (currentDir === 'asc' ? (
            <CaretUp className="h-3 w-3" weight="bold" />
          ) : (
            <CaretDown className="h-3 w-3" weight="bold" />
          ))}
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// ManageRidesPanel
// ---------------------------------------------------------------------------

interface ManageRidesPanelProps {
  rides: ManageRideData[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  initialPaceFilter?: string | null;
  isLeader?: boolean;
}

type StatusTab = 'upcoming' | 'past' | 'cancelled';

export function ManageRidesPanel({
  rides,
  paceGroups,
  initialPaceFilter = null,
  isLeader = false,
}: ManageRidesPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusTab>('upcoming');
  const [paceFilter, setPaceFilter] = useState<string>(initialPaceFilter ?? 'all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RideSortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  function handleSort(key: RideSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const visibleRides = useMemo(() => {
    let filtered = rides;

    if (statusFilter === 'upcoming') {
      filtered = filtered.filter((r) => r.ride_date >= today && r.status !== RideStatus.CANCELLED);
    } else if (statusFilter === 'past') {
      filtered = filtered.filter((r) => r.ride_date < today && r.status !== RideStatus.CANCELLED);
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter((r) => r.status === RideStatus.CANCELLED);
    }

    if (paceFilter !== 'all') {
      filtered = filtered.filter((r) => r.pace_group_id === paceFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.start_location_name?.toLowerCase().includes(q) ||
          r.created_by_name?.toLowerCase().includes(q),
      );
    }

    return [...filtered].sort((a, b) => compareRides(a, b, sortKey, sortDir));
  }, [rides, statusFilter, paceFilter, search, today, sortKey, sortDir]);

  // Mobile always shows chronological order (earliest → latest)
  const mobileRides = useMemo(
    () => [...visibleRides].sort((a, b) => compareRides(a, b, 'date', 'asc')),
    [visibleRides],
  );

  const emptyMessages: Record<StatusTab, string> = {
    upcoming: content.rides.noUpcomingRides,
    past: content.rides.noPastRides,
    cancelled: content.rides.noCancelledRides,
  };

  const statusFilterDef: FilterDefinition = {
    key: 'status',
    label: content.rides.filterStatus,
    defaultValue: 'upcoming',
    options: [
      { value: 'upcoming', label: content.rides.upcoming },
      { value: 'past', label: content.rides.past },
      { value: 'cancelled', label: content.rides.cancelled },
    ],
  };

  const paceFilterDef: FilterDefinition | null =
    paceGroups.length > 0
      ? {
          key: 'pace',
          label: content.rides.filterPace,
          defaultValue: 'all',
          options: [
            { value: 'all', label: content.rides.filterAll },
            ...paceGroups.map((pg) => ({ value: pg.id, label: pg.name })),
          ],
        }
      : null;

  const filters = [statusFilterDef, ...(paceFilterDef ? [paceFilterDef] : [])];
  const filterValues: Record<string, string> = { status: statusFilter, pace: paceFilter };

  function handleFilterChange(key: string, value: string) {
    if (key === 'status') setStatusFilter(value as StatusTab);
    if (key === 'pace') setPaceFilter(value);
    setPage(0);
  }

  // Paginate
  const paginatedRides = visibleRides.slice(page * pageSize, (page + 1) * pageSize);

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className="mt-4 space-y-3">
      <AdminFilterToolbar
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder={content.rides.searchPlaceholder}
      />

      {visibleRides.length === 0 ? (
        <EmptyState title={emptyMessages[statusFilter]} description={content.rides.noRides} />
      ) : (
        <>
          {/* Desktop table (admin: always, leader: md+) */}
          <div className="hidden overflow-x-auto rounded-md border border-(--border-subtle) md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-(--border-subtle) bg-(--surface-sunken)">
                  <SortableHeader label={content.rides.dateColumn} sortKey="date" {...sortProps} />
                  <SortableHeader label={ridesContent.form.title} sortKey="title" {...sortProps} />
                  <SortableHeader
                    label={ridesContent.form.paceGroup}
                    sortKey="pace"
                    {...sortProps}
                  />
                  <SortableHeader label={ridesContent.card.riders} sortKey="spots" {...sortProps} />
                  <SortableHeader
                    label={ridesContent.form.meetingLocation}
                    sortKey="location"
                    {...sortProps}
                  />
                  {!isLeader && (
                    <SortableHeader
                      label={content.rides.leaderColumn}
                      sortKey="leader"
                      {...sortProps}
                    />
                  )}
                  <th className="p-3 text-overline font-mono text-(--text-secondary)">
                    {content.rides.statusColumn}
                  </th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedRides.map((ride) => (
                  <DesktopRideRow key={ride.id} ride={ride} isLeader={isLeader} />
                ))}
              </tbody>
            </table>
            <TablePagination
              totalItems={visibleRides.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          {/* Mobile stacked rows — all filtered results, no pagination */}
          <div className="min-w-0 overflow-hidden rounded-md border border-(--border-subtle) divide-y divide-(--border-subtle) [&>*:nth-child(even)]:bg-(--surface-sunken) md:hidden">
            {mobileRides.map((ride) => (
              <MobileRideRow key={ride.id} ride={ride} isLeader={isLeader} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DesktopRideRow
// ---------------------------------------------------------------------------

function DesktopRideRow({ ride, isLeader }: { ride: ManageRideData; isLeader: boolean }) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCancelled = ride.status === RideStatus.CANCELLED;
  const isWeatherWatch = ride.status === RideStatus.WEATHER_WATCH;
  const isPast = ride.ride_date < new Date().toISOString().split('T')[0];
  const canCancel = !isCancelled && !isPast;
  const spotsText =
    ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : `${ride.signup_count}`;

  const dateFormatted = format(new Date(ride.ride_date), 'MMM d');
  const timeFormatted = formatTime(ride.start_time);

  function handleClick() {
    router.push(routes.manageEditRide(ride.id, routes.manageRides));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelRide(ride.id, '');
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setCancelOpen(false);
    });
  }

  let statusLabel: string = content.rides.upcoming;
  let statusClass = '';
  if (isCancelled) {
    statusLabel = ridesContent.status.cancelled;
    statusClass = 'text-(--feedback-error-text)';
  } else if (isWeatherWatch) {
    statusLabel = ridesContent.status.weatherWatch;
    statusClass = 'text-(--feedback-warning-text)';
  } else if (isPast) {
    statusLabel = content.rides.past;
    statusClass = 'text-(--text-tertiary)';
  }

  return (
    <tr
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      className={cn(
        'group cursor-pointer border-b border-(--border-subtle) last:border-b-0 even:bg-(--surface-sunken) hover:bg-muted/50',
        isCancelled && 'opacity-disabled',
        isPending && 'opacity-pending pointer-events-none',
      )}
    >
      <td className="whitespace-nowrap p-3 font-mono text-body-sm text-(--text-primary)">
        {dateFormatted}, {timeFormatted}
      </td>
      <td className="p-3 font-mono text-body-sm font-semibold text-(--text-primary)">
        {ride.title}
      </td>
      <td className="p-3">
        {ride.pace_group_name && ride.pace_group_sort_order != null ? (
          <Badge variant={getPaceBadgeVariant(ride.pace_group_sort_order)} size="sm">
            {ride.pace_group_name}
          </Badge>
        ) : (
          <span className="font-mono text-body-sm text-(--text-tertiary)">—</span>
        )}
      </td>
      <td className="whitespace-nowrap p-3 font-mono text-body-sm text-(--text-primary)">
        {spotsText}
      </td>
      <td className="max-w-[180px] truncate p-3 font-mono text-body-sm text-(--text-secondary)">
        {ride.start_location_name ?? '—'}
      </td>
      {!isLeader && (
        <td className="max-w-[140px] truncate p-3 font-mono text-body-sm text-(--text-tertiary)">
          {ride.created_by_name ?? '—'}
        </td>
      )}
      <td className={cn('p-3 font-mono text-body-sm', statusClass)}>{statusLabel}</td>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-muted/50 hover:text-(--text-primary)">
            <DotsThree className="h-4 w-4" weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleClick}>
              {ridesContent.actionBar.editRide}
            </DropdownMenuItem>
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
                  {ridesContent.actionBar.cancelRide}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{ridesContent.actionBar.cancelRideDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {ridesContent.actionBar.cancelRideDialogDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                {common.cancel}
              </AlertDialogClose>
              <Button variant="destructive" onClick={handleCancel}>
                {ridesContent.actionBar.confirmCancelRide}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// MobileRideRow
// ---------------------------------------------------------------------------

function MobileRideRow({ ride, isLeader }: { ride: ManageRideData; isLeader: boolean }) {
  const router = useRouter();
  const isCancelled = ride.status === RideStatus.CANCELLED;
  const isWeatherWatch = ride.status === RideStatus.WEATHER_WATCH;
  const spotsText =
    ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : `${ride.signup_count}`;

  const dateFormatted = `${format(new Date(ride.ride_date), 'MMM d')}, ${formatTime(ride.start_time)}`;

  let statusLabel = '';
  let statusClass = '';
  if (isCancelled) {
    statusLabel = ridesContent.status.cancelled;
    statusClass = 'text-(--feedback-error-text)';
  } else if (isWeatherWatch) {
    statusLabel = ridesContent.status.weatherWatch;
    statusClass = 'text-(--feedback-warning-text)';
  }

  function handleClick() {
    router.push(routes.manageEditRide(ride.id, routes.manageRides));
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="link"
      className={cn(
        'cursor-pointer px-3 py-2.5 hover:bg-muted/50',
        isCancelled && 'opacity-disabled',
      )}
    >
      <p className="min-w-0 truncate font-mono text-body-sm font-semibold text-(--text-primary)">
        {ride.title}
      </p>
      <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs">
        <span className="text-(--text-tertiary)">{content.rides.dateColumn}</span>
        <span className="truncate text-(--text-secondary)">{dateFormatted}</span>

        {ride.pace_group_name && (
          <>
            <span className="text-(--text-tertiary)">{ridesContent.form.paceGroup}</span>
            <span className="text-(--text-secondary)">{ride.pace_group_name}</span>
          </>
        )}

        <span className="text-(--text-tertiary)">{ridesContent.card.riders}</span>
        <span className="text-(--text-secondary)">{spotsText}</span>

        {!isLeader && ride.created_by_name && (
          <>
            <span className="text-(--text-tertiary)">{content.rides.leaderColumn}</span>
            <span className="truncate text-(--text-secondary)">{ride.created_by_name}</span>
          </>
        )}

        {statusLabel && (
          <>
            <span className="text-(--text-tertiary)">{content.rides.statusColumn}</span>
            <span className={statusClass}>{statusLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

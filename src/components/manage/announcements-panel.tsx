'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { PushPin, Plus, CaretUp, CaretDown, DotsThree } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AdminFilterToolbar, type FilterDefinition } from './admin-filter-toolbar';
import { TablePagination } from './table-pagination';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
} from '@/lib/manage/actions';
import type { AnnouncementType } from '@/types/database';

const { manage: content, common } = appContent;

const announcementTypes: AnnouncementType[] = ['info', 'warning', 'danger', 'success'];

/** Type indicator dot colours — small coloured dots, not Badge chips. */
const typeDotColors: Record<AnnouncementType, string> = {
  info: 'bg-(--feedback-info-default)',
  warning: 'bg-(--feedback-warning-default)',
  danger: 'bg-(--feedback-error-default)',
  success: 'bg-(--feedback-success-default)',
};

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  created_by_name: string | null;
  announcement_type: AnnouncementType;
  is_dismissible: boolean;
}

interface AnnouncementsPanelProps {
  announcements: AnnouncementData[];
  clubId: string;
}

/* ------------------------------------------------------------------ */
/*  Sort infrastructure                                                */
/* ------------------------------------------------------------------ */

type AnnouncementSortKey = 'type' | 'title' | 'published';
type SortDir = 'asc' | 'desc';

const typeOrder: Record<AnnouncementType, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
};

function compareAnnouncements(
  a: AnnouncementData,
  b: AnnouncementData,
  key: AnnouncementSortKey,
  dir: SortDir,
): number {
  const m = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'type':
      return ((typeOrder[a.announcement_type] ?? 99) - (typeOrder[b.announcement_type] ?? 99)) * m;
    case 'title':
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase()) * m;
    case 'published':
      return a.published_at.localeCompare(b.published_at) * m;
    default:
      return 0;
  }
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: AnnouncementSortKey;
  currentKey: AnnouncementSortKey;
  currentDir: SortDir;
  onSort: (key: AnnouncementSortKey) => void;
  className?: string;
}) {
  const isActive = sortKey === currentKey;
  return (
    <th
      className={cn(
        'cursor-pointer select-none p-3 text-overline font-mono text-(--text-secondary) hover:text-(--text-primary)',
        className,
      )}
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnnouncementsPanel({ announcements, clubId }: AnnouncementsPanelProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Sort
  const [sortKey, setSortKey] = useState<AnnouncementSortKey>('published');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: AnnouncementSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const visibleAnnouncements = useMemo(() => {
    let filtered = announcements;
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.announcement_type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
      );
    }
    return [...filtered].sort((a, b) => {
      // Pinned items always float to the top
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return compareAnnouncements(a, b, sortKey, sortDir);
    });
  }, [announcements, typeFilter, search, sortKey, sortDir]);

  const typeFilterDef: FilterDefinition = {
    key: 'type',
    label: content.announcements.filterType,
    defaultValue: 'all',
    options: [
      { value: 'all', label: content.announcements.filterAll },
      ...announcementTypes.map((t) => ({
        value: t,
        label: content.announcements.typeOptions[t],
      })),
    ],
  };

  const filterValues: Record<string, string> = { type: typeFilter };

  function handleFilterChange(key: string, value: string) {
    if (key === 'type') setTypeFilter(value);
    setPage(0);
  }

  const paginatedAnnouncements = visibleAnnouncements.slice(page * pageSize, (page + 1) * pageSize);

  const editingAnnouncement = announcements.find((a) => a.id === editingId);
  const editInitialValues = editingAnnouncement
    ? {
        title: editingAnnouncement.title,
        body: editingAnnouncement.body,
        announcementType: editingAnnouncement.announcement_type,
        isDismissible: editingAnnouncement.is_dismissible,
        isPinned: editingAnnouncement.is_pinned,
        expiresAt: editingAnnouncement.expires_at?.split('T')[0] ?? '',
      }
    : undefined;

  function handleEdit(a: AnnouncementData) {
    setEditingId(a.id);
    setOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleTogglePin(id: string, currentlyPinned: boolean) {
    startTransition(async () => {
      const result = await toggleAnnouncementPin(id, !currentlyPinned, clubId);
      if (result?.error) toast.error(result.error);
    });
  }

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className={cn('space-y-3', isPending && 'opacity-pending pointer-events-none')}>
      <AdminFilterToolbar
        filters={[typeFilterDef]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder={content.announcements.searchPlaceholder}
      />

      {visibleAnnouncements.length === 0 ? (
        <p className="font-mono text-body-sm text-(--text-secondary)">
          {content.announcements.noAnnouncements}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-md border border-(--border-subtle) md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-(--border-subtle) bg-(--surface-sunken)">
                  <SortableHeader
                    label={content.announcements.typeColumn}
                    sortKey="type"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.announcements.titleColumn}
                    sortKey="title"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.announcements.dateColumn}
                    sortKey="published"
                    {...sortProps}
                  />
                  <th className="p-3 text-overline font-mono text-(--text-secondary)">
                    {content.announcements.pinned}
                  </th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedAnnouncements.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => handleEdit(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEdit(a);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="group cursor-pointer border-b border-(--border-subtle) last:border-b-0 even:bg-(--surface-sunken) hover:bg-muted/50"
                  >
                    {/* Type dot + label */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-2 w-2 shrink-0 rounded-full',
                            typeDotColors[a.announcement_type],
                          )}
                        />
                        <span className="truncate font-mono text-body-sm text-(--text-tertiary)">
                          {content.announcements.typeOptions[a.announcement_type]}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="min-w-0 p-3">
                      <p className="truncate font-mono text-body-sm font-semibold text-(--text-primary)">
                        {a.title}
                      </p>
                    </td>

                    {/* Published */}
                    <td className="p-3">
                      <span className="whitespace-nowrap font-mono text-body-sm text-(--text-tertiary)">
                        {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                      </span>
                    </td>

                    {/* Pinned — clickable toggle */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(a.id, a.is_pinned)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-muted/50 hover:text-(--text-primary)"
                      >
                        <PushPin className="h-4 w-4" weight={a.is_pinned ? 'fill' : 'light'} />
                      </button>
                    </td>

                    {/* Actions — kebab menu */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-muted/50 hover:text-(--text-primary)">
                          <DotsThree className="h-4 w-4" weight="bold" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(a)}>
                            {content.announcements.edit}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(a.id)}
                          >
                            {content.announcements.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              totalItems={visibleAnnouncements.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          {/* Mobile condensed rows — all filtered results, no pagination */}
          <div className="min-w-0 overflow-hidden rounded-md border border-(--border-subtle) divide-y divide-(--border-subtle) [&>*:nth-child(even)]:bg-(--surface-sunken) md:hidden">
            {visibleAnnouncements.map((a) => (
              <MobileAnnouncementRow key={a.id} announcement={a} onEdit={handleEdit} />
            ))}
          </div>
        </>
      )}

      <AnnouncementFormDrawer
        open={open}
        onOpenChange={setOpen}
        mode="edit"
        announcementId={editingId ?? undefined}
        initialValues={editInitialValues}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AnnouncementFormDrawer — shared create / edit form                  */
/* ------------------------------------------------------------------ */

interface AnnouncementFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  clubId?: string;
  announcementId?: string;
  initialValues?: {
    title: string;
    body: string;
    announcementType: AnnouncementType;
    isDismissible: boolean;
    isPinned: boolean;
    expiresAt: string;
  };
  onSuccess?: () => void;
}

function AnnouncementFormDrawer({
  open,
  onOpenChange,
  mode,
  clubId,
  announcementId,
  initialValues,
  onSuccess,
}: AnnouncementFormDrawerProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('info');
  const [isDismissible, setIsDismissible] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle('');
    setBody('');
    setAnnouncementType('info');
    setIsDismissible(true);
    setIsPinned(false);
    setExpiresAt('');
  }

  // Sync form state when drawer opens
  /* eslint-disable react-hooks/set-state-in-effect -- sync initial values on open */
  useEffect(() => {
    if (open && initialValues) {
      setTitle(initialValues.title);
      setBody(initialValues.body);
      setAnnouncementType(initialValues.announcementType);
      setIsDismissible(initialValues.isDismissible);
      setIsPinned(initialValues.isPinned);
      setExpiresAt(initialValues.expiresAt);
    } else if (open) {
      resetForm();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (!isOpen) resetForm();
  }

  function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      const payload = {
        title,
        body,
        announcement_type: announcementType,
        is_dismissible: isDismissible,
        is_pinned: isPinned,
        expires_at: expiresAt || null,
      };

      const result =
        mode === 'create'
          ? await createAnnouncement(clubId!, payload)
          : await updateAnnouncement(announcementId!, payload);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    });
  }

  const idPrefix = mode;
  const headerText = mode === 'create' ? content.announcements.create : content.announcements.edit;
  const submitText = mode === 'create' ? content.announcements.create : common.save;

  if (!mounted) return null;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent
        className={isMobile ? 'max-h-(--drawer-height-md)' : 'w-(--drawer-width-sidebar)'}
      >
        <DrawerHeader>
          <DrawerTitle>{headerText}</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
          <FloatingField
            label={content.announcements.titleLabel}
            htmlFor={`${idPrefix}-announcement-title`}
            hasValue={!!title}
          >
            <Input
              id={`${idPrefix}-announcement-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField
            label={content.announcements.bodyLabel}
            htmlFor={`${idPrefix}-announcement-body`}
            hasValue={!!body}
            maxLength={500}
          >
            <Textarea
              id={`${idPrefix}-announcement-body`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder=" "
              rows={4}
              maxLength={500}
            />
          </FloatingField>
          <FloatingField
            label={content.announcements.typeLabel}
            htmlFor={`${idPrefix}-announcement-type`}
            hasValue={true}
          >
            <Select
              value={announcementType}
              onValueChange={(v) => setAnnouncementType(v as AnnouncementType)}
              items={Object.fromEntries(
                announcementTypes.map((t) => [t, content.announcements.typeOptions[t]]),
              )}
            >
              <SelectTrigger id={`${idPrefix}-announcement-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {announcementTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {content.announcements.typeOptions[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FloatingField>
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}-dismissible-toggle`}>
              {content.announcements.dismissibleLabel}
            </Label>
            <Switch
              id={`${idPrefix}-dismissible-toggle`}
              checked={isDismissible}
              onCheckedChange={setIsDismissible}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}-pinned-toggle`}>{content.announcements.pinToTop}</Label>
            <Switch
              id={`${idPrefix}-pinned-toggle`}
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
          </div>
          <FloatingField
            label={content.announcements.expiryLabel}
            htmlFor={`${idPrefix}-announcement-expiry`}
            hasValue={!!expiresAt}
            helperText={content.announcements.expiryDescription}
          >
            <DatePicker
              id={`${idPrefix}-announcement-expiry`}
              value={expiresAt}
              onChange={setExpiresAt}
            />
          </FloatingField>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isPending || !title.trim() || !body.trim()}>
            {submitText}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {common.cancel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/*  CreateAnnouncementButton — self-contained create trigger + drawer  */
/* ------------------------------------------------------------------ */

interface CreateAnnouncementButtonProps {
  clubId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateAnnouncementButton({
  clubId,
  trigger,
  onSuccess,
}: CreateAnnouncementButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <span
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        >
          {trigger}
        </span>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {content.announcements.create}
        </Button>
      )}

      <AnnouncementFormDrawer
        open={open}
        onOpenChange={setOpen}
        mode="create"
        clubId={clubId}
        onSuccess={onSuccess}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// MobileAnnouncementRow
// ---------------------------------------------------------------------------

function MobileAnnouncementRow({
  announcement: a,
  onEdit,
}: {
  announcement: AnnouncementData;
  onEdit: (a: AnnouncementData) => void;
}) {
  return (
    <div
      onClick={() => onEdit(a)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(a);
        }
      }}
      tabIndex={0}
      role="button"
      className="min-w-0 cursor-pointer overflow-hidden px-3 py-2.5 hover:bg-muted/50"
    >
      <div className="flex items-center gap-2">
        <p className="truncate font-mono text-body-sm font-semibold text-(--text-primary)">
          {a.title}
        </p>
        {a.is_pinned && (
          <PushPin className="h-3.5 w-3.5 shrink-0 text-(--text-tertiary)" weight="fill" />
        )}
      </div>
      <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs">
        <span className="text-(--text-tertiary)">{content.announcements.typeColumn}</span>
        <span className="text-(--text-secondary)">
          {content.announcements.typeOptions[a.announcement_type]}
        </span>

        <span className="text-(--text-tertiary)">{content.announcements.dateColumn}</span>
        <span className="text-(--text-secondary)">
          {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

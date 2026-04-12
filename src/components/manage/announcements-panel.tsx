'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  PushPin,
  Plus,
  CaretUp,
  CaretDown,
  DotsThree,
  Megaphone,
} from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPresets } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { useCompositionSafe } from '@/hooks/use-composition-safe';
import { Textarea } from '@/components/ui/textarea';
import { CardIconHeader } from '@/components/ui/card-icon-header';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import {
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AdminFilterToolbar } from './admin-filter-toolbar';
import { TablePagination } from './table-pagination';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import type { AnnouncementType } from '@/types/database';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
} from '@/lib/manage/actions';

const { manage: content, common } = appContent;

const announcementTypes: AnnouncementType[] = ['general', 'event', 'urgent'];

const announcementTypeOptions = announcementTypes.map((t) => ({
  value: t,
  label: content.announcements.typeOptions[t],
}));

/** Badge variant per announcement type. */
const typeBadgeVariant: Record<AnnouncementType, 'type-general' | 'type-event' | 'type-urgent'> = {
  general: 'type-general',
  event: 'type-event',
  urgent: 'type-urgent',
};

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  announcement_type: AnnouncementType;
  is_dismissible: boolean;
  created_by_name: string | null;
}

interface AnnouncementsPanelProps {
  announcements: AnnouncementData[];
  clubId: string;
}

/* ------------------------------------------------------------------ */
/*  Sort infrastructure                                                */
/* ------------------------------------------------------------------ */

type AnnouncementSortKey = 'title' | 'published';
type SortDir = 'asc' | 'desc';

function compareAnnouncements(
  a: AnnouncementData,
  b: AnnouncementData,
  key: AnnouncementSortKey,
  dir: SortDir,
): number {
  const m = dir === 'asc' ? 1 : -1;
  switch (key) {
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
        'cursor-pointer select-none p-3 text-overline font-sans text-(--text-secondary) hover:text-(--text-primary)',
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
  const { listItem } = useMotionPresets();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

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
  }, [announcements, search, sortKey, sortDir]);

  const paginatedAnnouncements = visibleAnnouncements.slice(page * pageSize, (page + 1) * pageSize);

  const editingAnnouncement = announcements.find((a) => a.id === editingId);
  const editInitialValues = editingAnnouncement
    ? {
        title: editingAnnouncement.title,
        body: editingAnnouncement.body,
        announcementType: editingAnnouncement.announcement_type,
        isDismissible: editingAnnouncement.is_dismissible,
        isPinned: editingAnnouncement.is_pinned,
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
        filters={[]}
        filterValues={{}}
        onFilterChange={() => {}}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder={content.announcements.searchPlaceholder}
      />

      {visibleAnnouncements.length === 0 ? (
        <EmptyState
          title={content.announcements.noAnnouncements}
          description={content.announcements.noFilterResults}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="overflow-x-auto rounded-md border border-(--border-default)">
            <table className="w-full bg-(--surface-default) text-left">
              <thead>
                <tr className="border-b border-(--border-default) bg-(--surface-sunken)">
                  <SortableHeader
                    label={content.announcements.titleColumn}
                    sortKey="title"
                    {...sortProps}
                  />
                  <th className="p-3 text-overline font-sans text-(--text-secondary)">
                    {content.announcements.typeColumn}
                  </th>
                  <SortableHeader
                    label={content.announcements.dateColumn}
                    sortKey="published"
                    {...sortProps}
                  />
                  <th className="p-3 text-overline font-sans text-(--text-secondary)">
                    {content.announcements.pinned}
                  </th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {paginatedAnnouncements.map((a) => (
                    <motion.tr
                      key={a.id}
                      layout
                      variants={listItem}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => handleEdit(a)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEdit(a);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="group cursor-pointer border-b border-(--border-subtle) last:border-b-0 even:bg-(--surface-page) hover:bg-(--action-primary-subtle-bg)"
                    >
                      {/* Title */}
                      <td className="min-w-0 p-3">
                        <p className="truncate font-sans text-xs font-semibold text-(--text-primary)">
                          {a.title}
                        </p>
                      </td>

                      {/* Type badge */}
                      <td className="p-3">
                        <Badge variant={typeBadgeVariant[a.announcement_type]} size="sm">
                          {content.announcements.typeOptions[a.announcement_type]}
                        </Badge>
                      </td>

                      {/* Published */}
                      <td className="p-3">
                        <span className="whitespace-nowrap font-sans text-xs text-(--text-tertiary)">
                          {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                        </span>
                      </td>

                      {/* Pinned — clickable toggle */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleTogglePin(a.id, a.is_pinned)}
                          className="text-(--text-tertiary) hover:text-(--text-primary)"
                        >
                          <PushPin className="size-4" weight={a.is_pinned ? 'fill' : 'light'} />
                        </Button>
                      </td>

                      {/* Actions — kebab menu */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-(--action-primary-subtle-bg) hover:text-(--text-primary)">
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
                    </motion.tr>
                  ))}
                </AnimatePresence>
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
  };
  onSuccess?: () => void;
}

export function AnnouncementFormDrawer({
  open,
  onOpenChange,
  mode,
  clubId,
  announcementId,
  initialValues,
  onSuccess,
}: AnnouncementFormDrawerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('general');
  const [isDismissible, setIsDismissible] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isPending, startTransition] = useTransition();

  const titleCompositionProps = useCompositionSafe(setTitle);
  const bodyCompositionProps = useCompositionSafe(setBody);

  function resetForm() {
    setTitle('');
    setBody('');
    setAnnouncementType('general');
    setIsDismissible(true);
    setIsPinned(false);
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
    } else if (open) {
      resetForm();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
  }

  function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      const createPayload = {
        title,
        body,
        announcement_type: announcementType,
        is_dismissible: isDismissible,
      };
      const updatePayload = {
        title,
        body,
        announcement_type: announcementType,
        is_dismissible: isDismissible,
        is_pinned: isPinned,
      };

      const result =
        mode === 'create'
          ? await createAnnouncement(clubId!, createPayload)
          : await updateAnnouncement(announcementId!, updatePayload);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    });
  }

  const headerText = mode === 'create' ? content.announcements.create : content.announcements.edit;
  const submitText =
    mode === 'create' ? content.announcements.create : content.announcements.update;

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={handleOpenChange}
      size="auto"
      className="overflow-clip"
    >
      <DrawerHeader>
        <DrawerTitle className="sr-only">{headerText}</DrawerTitle>
        <DrawerDescription className="sr-only">{content.announcements.bodyLabel}</DrawerDescription>
        <CardIconHeader icon={Megaphone} title={headerText} />
      </DrawerHeader>
      <DrawerBody className="space-y-6 pt-2">
        <FloatingField
          label={content.announcements.titleLabel}
          htmlFor={`${mode}-announcement-title`}
          hasValue={!!title}
        >
          <Input
            id={`${mode}-announcement-title`}
            value={title}
            {...titleCompositionProps}
            placeholder=" "
          />
        </FloatingField>
        <FloatingField
          label={content.announcements.bodyLabel}
          htmlFor={`${mode}-announcement-body`}
          hasValue={!!body}
          maxLength={500}
        >
          <Textarea
            id={`${mode}-announcement-body`}
            value={body}
            {...bodyCompositionProps}
            placeholder=" "
            rows={4}
            maxLength={500}
          />
        </FloatingField>
        <SegmentedControl
          value={announcementType}
          onValueChange={(v) => setAnnouncementType(v as AnnouncementType)}
          options={announcementTypeOptions}
          ariaLabel="Announcement type"
          className="w-full"
        />
        <div className="rounded-2xl bg-surface-sunken p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${mode}-dismissible-toggle`}>
              {content.announcements.dismissibleLabel}
            </Label>
            <Switch
              id={`${mode}-dismissible-toggle`}
              checked={isDismissible}
              onCheckedChange={setIsDismissible}
            />
          </div>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !body.trim()}
        >
          {submitText}
        </Button>
        <DrawerClose asChild>
          <Button variant="ghost" size="lg" className="w-full">
            {common.cancel}
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </ResponsiveDrawer>
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

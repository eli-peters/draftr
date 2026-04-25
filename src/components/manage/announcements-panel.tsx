'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { PushPin, Plus, Megaphone } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMotionPresets } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingField } from '@/components/ui/floating-field';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardIconHeader } from '@/components/ui/card-icon-header';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { FormRootError, nativeInputPresets, useFormSubmit } from '@/lib/forms';
import {
  ANNOUNCEMENT_BODY_MAX,
  announcementSchema,
  type AnnouncementValues,
} from '@/lib/forms/schemas';
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableKebab,
  adminTableRowClasses,
} from '@/components/manage/admin-table';
import { AdminFilterToolbar } from './admin-filter-toolbar';
import { TablePagination } from './table-pagination';
import { cn } from '@/lib/utils';
import { SortableHeader, type SortDir } from '@/components/manage/sortable-header';
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
          <AdminTable
            footer={
              <TablePagination
                totalItems={visibleAnnouncements.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            }
          >
            <AdminTableHead>
              <SortableHeader
                label={content.announcements.titleColumn}
                sortKey="title"
                {...sortProps}
              />
              <AdminTableHeaderCell>{content.announcements.typeColumn}</AdminTableHeaderCell>
              <SortableHeader
                label={content.announcements.dateColumn}
                sortKey="published"
                {...sortProps}
              />
              <AdminTableHeaderCell>{content.announcements.pinned}</AdminTableHeaderCell>
              <th className="w-10 p-3" />
            </AdminTableHead>
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
                    className={cn(adminTableRowClasses, 'cursor-pointer')}
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
                      <span className="whitespace-nowrap font-sans text-xs tabular-nums text-(--text-tertiary)">
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
                        <AdminTableKebab />
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
          </AdminTable>
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

const DEFAULT_ANNOUNCEMENT_VALUES: AnnouncementValues = {
  title: '',
  body: '',
  announcement_type: 'general',
  is_dismissible: true,
  is_pinned: false,
};

export function AnnouncementFormDrawer({
  open,
  onOpenChange,
  mode,
  clubId,
  announcementId,
  initialValues,
  onSuccess,
}: AnnouncementFormDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: DEFAULT_ANNOUNCEMENT_VALUES,
    mode: 'onTouched',
  });

  // Sync form values when drawer opens — initialValues only meaningful in edit mode.

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      form.reset({
        title: initialValues.title,
        body: initialValues.body,
        announcement_type: initialValues.announcementType,
        is_dismissible: initialValues.isDismissible,
        is_pinned: initialValues.isPinned,
      });
    } else {
      form.reset(DEFAULT_ANNOUNCEMENT_VALUES);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = useFormSubmit({
    form,
    onSubmit: async (values) => {
      const result = await new Promise<{ error?: string } | void>((resolve) => {
        startTransition(async () => {
          const createPayload = {
            title: values.title,
            body: values.body,
            announcement_type: values.announcement_type,
            is_dismissible: values.is_dismissible,
          };
          const updatePayload = {
            ...createPayload,
            is_pinned: values.is_pinned,
          };
          const r =
            mode === 'create'
              ? await createAnnouncement(clubId!, createPayload)
              : await updateAnnouncement(announcementId!, updatePayload);
          resolve(r);
        });
      });

      if (result?.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      onOpenChange(false);
      form.reset(DEFAULT_ANNOUNCEMENT_VALUES);
      onSuccess?.();
    },
  });

  const headerText = mode === 'create' ? content.announcements.create : content.announcements.edit;
  const submitText =
    mode === 'create' ? content.announcements.create : content.announcements.update;
  const submitting = isPending || form.formState.isSubmitting;

  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange} size="auto" className="overflow-clip">
      <DrawerHeader>
        <DrawerTitle className="sr-only">{headerText}</DrawerTitle>
        <DrawerDescription className="sr-only">{content.announcements.bodyLabel}</DrawerDescription>
        <CardIconHeader icon={Megaphone} title={headerText} />
      </DrawerHeader>
      <Form {...form}>
        <form id={`${mode}-announcement-form`} onSubmit={onSubmit} noValidate className="contents">
          <DrawerBody className="space-y-6 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FloatingField label={content.announcements.titleLabel} hasValue={!!field.value}>
                    <FormControl>
                      <Input {...nativeInputPresets.prose} placeholder=" " {...field} />
                    </FormControl>
                  </FloatingField>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FloatingField
                    label={content.announcements.bodyLabel}
                    hasValue={!!field.value}
                    maxLength={ANNOUNCEMENT_BODY_MAX}
                  >
                    <FormControl>
                      <Textarea
                        {...nativeInputPresets.composer}
                        placeholder=" "
                        rows={4}
                        maxLength={ANNOUNCEMENT_BODY_MAX}
                        {...field}
                      />
                    </FormControl>
                  </FloatingField>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="announcement_type"
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as AnnouncementType)}
                  options={announcementTypeOptions}
                  ariaLabel={content.announcements.typeAriaLabel}
                  className="w-full"
                />
              )}
            />

            <FormField
              control={form.control}
              name="is_dismissible"
              render={({ field }) => (
                <div className="rounded-2xl bg-surface-sunken p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${mode}-dismissible-toggle`}>
                      {content.announcements.dismissibleLabel}
                    </Label>
                    <Switch
                      id={`${mode}-dismissible-toggle`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </div>
              )}
            />

            <FormRootError />
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="submit"
              form={`${mode}-announcement-form`}
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? <ButtonSpinner className="size-5" /> : null}
              {submitText}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" size="lg" className="w-full">
                {common.cancel}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </Form>
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

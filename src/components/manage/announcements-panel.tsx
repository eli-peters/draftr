'use client';

import { useEffect, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PushPin, Trash, PencilSimple, Plus } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
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

/**
 * Static badge styles per type — Tailwind v4 requires full class strings to be scannable.
 * "danger" maps to the "error" feedback token family.
 */
const typeBadgeStyles: Record<AnnouncementType, string> = {
  info: 'bg-(--feedback-info-bg) text-(--feedback-info-text) border-(--feedback-info-default)/20',
  warning:
    'bg-(--feedback-warning-bg) text-(--feedback-warning-text) border-(--feedback-warning-default)/20',
  danger:
    'bg-(--feedback-error-bg) text-(--feedback-error-text) border-(--feedback-error-default)/20',
  success:
    'bg-(--feedback-success-bg) text-(--feedback-success-text) border-(--feedback-success-default)/20',
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

export function AnnouncementsPanel({ announcements, clubId }: AnnouncementsPanelProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('info');
  const [isDismissible, setIsDismissible] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleNew() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setAnnouncementType('info');
    setIsDismissible(true);
    setExpiresAt('');
    setOpen(true);
  }

  function handleEdit(a: AnnouncementData) {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setAnnouncementType(a.announcement_type);
    setIsDismissible(a.is_dismissible);
    setExpiresAt(a.expires_at?.split('T')[0] ?? '');
    setOpen(true);
  }

  function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      const payload = {
        title,
        body,
        announcement_type: announcementType,
        is_dismissible: isDismissible,
        expires_at: expiresAt || null,
      };
      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(clubId, payload);
      }
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAnnouncement(id);
    });
  }

  function handleTogglePin(id: string, currentlyPinned: boolean) {
    startTransition(async () => {
      await toggleAnnouncementPin(id, !currentlyPinned, clubId);
    });
  }

  return (
    <div className={isPending ? 'opacity-pending pointer-events-none' : ''}>
      <ContentToolbar
        left={<SectionHeading>{content.announcements.heading}</SectionHeading>}
        right={
          <Button size="sm" variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            {content.announcements.create}
          </Button>
        }
        className="mb-4"
      />

      {announcements.length === 0 ? (
        <p className="text-base text-muted-foreground">{content.announcements.noAnnouncements}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{a.title}</h3>
                    {a.is_pinned && (
                      <Badge variant="outline" className="text-xs">
                        {content.announcements.pinned}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${typeBadgeStyles[a.announcement_type] ?? ''}`}
                    >
                      {content.announcements.typeOptions[a.announcement_type]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/75 leading-relaxed line-clamp-3">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.created_by_name} &middot;{' '}
                    {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleTogglePin(a.id, a.is_pinned)}
                    className="text-muted-foreground/50 hover:text-primary"
                    title={a.is_pinned ? content.announcements.unpin : content.announcements.pin}
                  >
                    <PushPin weight={a.is_pinned ? 'fill' : undefined} className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(a)}
                    className="text-muted-foreground/50 hover:text-foreground"
                    title={content.announcements.edit}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(a.id)}
                    className="text-muted-foreground/50 hover:text-destructive"
                    title={content.announcements.delete}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mounted && (
        <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? 'bottom' : 'right'}>
          <DrawerContent
            className={
              isMobile
                ? 'max-h-(--drawer-height-md) overflow-y-auto'
                : 'w-(--drawer-width-sidebar) overflow-y-auto'
            }
          >
            <DrawerHeader>
              <DrawerTitle>
                {editingId ? content.announcements.edit : content.announcements.create}
              </DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-2">
                <Label>{content.announcements.titleLabel}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={content.announcements.titlePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label>{content.announcements.bodyLabel}</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={content.announcements.bodyPlaceholder}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{content.announcements.typeLabel}</Label>
                <Select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value as AnnouncementType)}
                >
                  {announcementTypes.map((type) => (
                    <option key={type} value={type}>
                      {content.announcements.typeOptions[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dismissible-toggle">{content.announcements.dismissibleLabel}</Label>
                <Switch
                  id="dismissible-toggle"
                  checked={isDismissible}
                  onCheckedChange={setIsDismissible}
                />
              </div>
              <div className="space-y-2">
                <Label>{content.announcements.expiryLabel}</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {content.announcements.expiryDescription}
                </p>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleSubmit} disabled={!title.trim() || !body.trim()}>
                {editingId ? common.save : content.announcements.create}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

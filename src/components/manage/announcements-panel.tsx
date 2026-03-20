'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PushPin, Trash, PencilSimple, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from '@/components/ui/sheet';
import { appContent } from '@/content/app';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
} from '@/lib/manage/actions';

const { manage: content, common } = appContent;

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  created_by_name: string | null;
}

interface AnnouncementsPanelProps {
  announcements: AnnouncementData[];
  clubId: string;
}

export function AnnouncementsPanel({ announcements, clubId }: AnnouncementsPanelProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleNew() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setOpen(true);
  }

  function handleEdit(a: AnnouncementData) {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setOpen(true);
  }

  function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      if (editingId) {
        await updateAnnouncement(editingId, { title, body });
      } else {
        await createAnnouncement(clubId, { title, body });
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
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>{content.announcements.heading}</SectionHeading>
        <Button size="sm" variant="outline" onClick={handleNew}>
          <Plus className="h-4 w-4 mr-1.5" />
          {content.announcements.create}
        </Button>
      </div>

      {announcements.length === 0 ? (
        <p className="text-base text-muted-foreground">{content.announcements.noAnnouncements}</p>
      ) : (
        <div className="space-y-3">
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
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/75 leading-relaxed line-clamp-3">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.created_by_name} ·{' '}
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-(--sheet-height-md) overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? content.announcements.edit : content.announcements.create}
            </SheetTitle>
          </SheetHeader>
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
          </div>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={!title.trim() || !body.trim()}>
              {editingId ? common.save : content.announcements.create}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

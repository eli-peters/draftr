'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, Confetti, Warning, X } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';
import { dismissAnnouncement } from '@/lib/manage/actions';
import type { AnnouncementType } from '@/types/database';

const { dashboard: content } = appContent;

/**
 * Static class map — Tailwind v4 requires full class strings to be scannable.
 */
const typeStyles: Record<
  AnnouncementType,
  { container: string; icon: string; title: string; body: string; meta: string }
> = {
  general: {
    container: 'bg-(--feedback-info-bg)',
    icon: 'text-(--feedback-info-default)',
    title: 'text-(--feedback-info-text)',
    body: 'text-(--feedback-info-text)/75',
    meta: 'text-(--feedback-info-text)/50',
  },
  event: {
    container: 'bg-(--feedback-success-bg)',
    icon: 'text-(--feedback-success-default)',
    title: 'text-(--feedback-success-text)',
    body: 'text-(--feedback-success-text)/75',
    meta: 'text-(--feedback-success-text)/50',
  },
  urgent: {
    container: 'bg-(--feedback-warning-bg)',
    icon: 'text-(--feedback-warning-default)',
    title: 'text-(--feedback-warning-text)',
    body: 'text-(--feedback-warning-text)/75',
    meta: 'text-(--feedback-warning-text)/50',
  },
};

const typeIcons: Record<AnnouncementType, typeof Megaphone> = {
  general: Megaphone,
  event: Confetti,
  urgent: Warning,
};

interface AnnouncementBannerProps {
  announcement: {
    id: string;
    title: string;
    body: string;
    announcement_type: AnnouncementType;
    is_dismissible: boolean;
    created_by_name: string | null;
    published_at: string;
  };
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  const styles = typeStyles[announcement.announcement_type];
  const Icon = typeIcons[announcement.announcement_type];
  const timeAgo = formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true });

  function handleDismiss() {
    setDismissed(true);
    startTransition(async () => {
      await dismissAnnouncement(announcement.id);
    });
  }

  return (
    <div className={`px-5 md:px-6 py-3 ${styles.container}`} role="status">
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${styles.icon}`} weight="fill" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-md font-semibold mb-1 ${styles.title}`}>{announcement.title}</p>
              <p className={`text-sm leading-relaxed mb-2 ${styles.body}`}>{announcement.body}</p>
              {announcement.created_by_name && (
                <p className={`text-xs ${styles.meta}`}>
                  {announcement.created_by_name} &middot; {timeAgo}
                </p>
              )}
            </div>
            {announcement.is_dismissible && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDismiss}
                disabled={isPending}
                className={`shrink-0 ${styles.meta}`}
                aria-label={content.announcementBanner.dismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

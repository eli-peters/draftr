'use client';

import { useState } from 'react';
import { Megaphone, X } from '@phosphor-icons/react';
import { appContent } from '@/content/app';

const { dashboard: content } = appContent;

interface AnnouncementBannerProps {
  announcement: {
    id: string;
    title: string;
    body: string;
    created_by_name: string | null;
  };
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
        aria-label={content.announcementBanner.dismiss}
      >
        <X weight="bold" className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Megaphone weight="duotone" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{announcement.title}</h3>
          <p className="mt-1 text-sm text-foreground/75 leading-relaxed line-clamp-3">
            {announcement.body}
          </p>
          {announcement.created_by_name && (
            <p className="mt-2 text-xs text-muted-foreground">— {announcement.created_by_name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

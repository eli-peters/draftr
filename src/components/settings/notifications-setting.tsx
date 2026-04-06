'use client';

import { useTransition } from 'react';
import { Bell } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import { updateNotificationPreference } from '@/lib/profile/actions';

const content = appContent.settings.notifications;

interface NotificationsSettingProps {
  pushEnabled: boolean;
}

export function NotificationsSetting({ pushEnabled }: NotificationsSettingProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await updateNotificationPreference(checked);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <ContentCard padding="compact" heading={content.heading}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {pushEnabled ? content.description : content.descriptionOff}
          </p>
        </div>
        <Switch checked={pushEnabled} onCheckedChange={handleToggle} disabled={isPending} />
      </div>
    </ContentCard>
  );
}

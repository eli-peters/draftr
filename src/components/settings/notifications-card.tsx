'use client';

import { useState, useTransition } from 'react';
import { Bell } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { Toggle } from '@/components/ui/switch';
import { SettingRow } from '@/components/settings/setting-row';
import { settingsContent } from '@/content/settings';
import { updateNotificationChannel } from '@/lib/profile/actions';
import {
  type NotificationChannel,
  type NotificationPreferences,
} from '@/types/notification-preferences';

const { notifications: content } = settingsContent;

interface NotificationsCardProps {
  initialPrefs: NotificationPreferences;
  email: string;
}

export function NotificationsCard({ initialPrefs, email }: NotificationsCardProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  const [, startTransition] = useTransition();

  function handleChannelChange(channel: NotificationChannel, enabled: boolean) {
    const previous = prefs;
    setPrefs({
      ...prefs,
      channels: { ...prefs.channels, [channel]: enabled },
    });
    startTransition(async () => {
      const result = await updateNotificationChannel(channel, enabled);
      if (result && 'error' in result) {
        toast.error(result.error);
        setPrefs(previous);
      }
    });
  }

  return (
    <ContentCard icon={Bell} heading={content.title} padding="spacious">
      <div className="divide-y divide-border">
        <SettingRow
          label={content.channels.push.label}
          description={content.channels.push.description}
        >
          <Toggle
            checked={prefs.channels.push}
            onCheckedChange={(v) => handleChannelChange('push', v)}
            aria-label={content.channels.push.label}
          />
        </SettingRow>
        <SettingRow
          label={content.channels.email.label}
          description={content.channels.email.descriptionTemplate(email)}
        >
          <Toggle
            checked={prefs.channels.email}
            onCheckedChange={(v) => handleChannelChange('email', v)}
            aria-label={content.channels.email.label}
          />
        </SettingRow>
      </div>
    </ContentCard>
  );
}

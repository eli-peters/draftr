import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { ActivityEvent } from '@/lib/manage/queries';

const { dashboard: content } = appContent.manage;

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getActionDescription(event: ActivityEvent): string {
  switch (event.type) {
    case 'signup':
      return content.activity.signupAction(event.detail);
    case 'cancellation':
      return content.activity.cancellationAction(event.detail);
    case 'new_member':
      return content.activity.newMemberAction;
  }
}

function getEventHref(event: ActivityEvent): string {
  if (event.rideId) return routes.ride(event.rideId);
  return routes.publicProfile(event.userId);
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{content.activity.heading}</h3>
        <div className="min-w-0 overflow-hidden rounded-md border border-(--border-subtle) px-3 py-8">
          <p className="text-sm text-muted-foreground">{content.activity.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{content.activity.heading}</h3>
      <div className="min-w-0 overflow-hidden rounded-md border border-(--border-subtle) divide-y divide-(--border-subtle)">
        {events.map((event) => (
          <Link
            key={event.id}
            href={getEventHref(event)}
            className="flex min-w-0 items-start gap-3 px-3 py-2.5 hover:bg-muted/50"
          >
            <Avatar className="mt-0.5 h-8 w-8 shrink-0">
              {event.avatarUrl && <AvatarImage src={event.avatarUrl} alt={event.userName} />}
              <AvatarFallback
                className={`text-xs font-medium ${getAvatarColourClasses(event.userName)}`}
              >
                {getInitials(event.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-xs font-medium text-(--text-primary)">
                {event.userName}
              </p>
              <p className="mt-0.5 truncate font-sans text-xs text-(--text-secondary)">
                {getActionDescription(event)}
              </p>
            </div>
            <span className="mt-0.5 shrink-0 font-sans text-xs text-(--text-tertiary)">
              {formatRelativeTime(event.timestamp)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

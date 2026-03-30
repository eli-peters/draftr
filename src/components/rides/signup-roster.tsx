import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { getInitials } from '@/lib/utils';
import { SignupStatus } from '@/config/statuses';
import { routes } from '@/config/routes';

const { rides: ridesContent } = appContent;

interface SignupEntry {
  id: string;
  status: string;
  signed_up_at: string | null;
  waitlist_position: number | null;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
}

interface SignupRosterProps {
  signups: SignupEntry[];
  createdBy?: string | null;
  coLeaderIds?: string[];
}

export function SignupRoster({ signups, createdBy, coLeaderIds = [] }: SignupRosterProps) {
  if (signups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {ridesContent.roster.noSignups}
      </p>
    );
  }

  const confirmed = signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  );
  const waitlisted = signups.filter((s) => s.status === SignupStatus.WAITLISTED);

  const leaderIds = new Set([...(createdBy ? [createdBy] : []), ...coLeaderIds]);

  // Pin ride leaders to the top of the confirmed list (creator first)
  const sortedConfirmed = [...confirmed].sort((a, b) => {
    const aIsLeader = leaderIds.has(a.user_id);
    const bIsLeader = leaderIds.has(b.user_id);
    if (aIsLeader && !bIsLeader) return -1;
    if (!aIsLeader && bIsLeader) return 1;
    if (aIsLeader && bIsLeader && a.user_id === createdBy) return -1;
    if (aIsLeader && bIsLeader && b.user_id === createdBy) return 1;
    return 0;
  });

  return (
    <div className="space-y-1">
      {sortedConfirmed.map((signup) => (
        <SignupRow key={signup.id} signup={signup} isLeader={leaderIds.has(signup.user_id)} />
      ))}
      {waitlisted.length > 0 && (
        <>
          <SectionHeading as="p" className="pt-3 pb-1">
            {ridesContent.roster.waitlisted}
          </SectionHeading>
          {waitlisted.map((signup) => (
            <SignupRow key={signup.id} signup={signup} isLeader={leaderIds.has(signup.user_id)} />
          ))}
        </>
      )}
    </div>
  );
}

function SignupRow({ signup, isLeader }: { signup: SignupEntry; isLeader?: boolean }) {
  const initials = getInitials(signup.user_name);

  return (
    <Link
      href={routes.publicProfile(signup.user_id)}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
    >
      <Avatar className="h-8 w-8">
        {signup.avatar_url && <AvatarImage src={signup.avatar_url} alt={signup.user_name} />}
        <AvatarFallback
          className={`text-xs font-medium ${getAvatarColourClasses(signup.user_name)}`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{signup.user_name}</p>
        {signup.signed_up_at && (
          <p className="text-xs text-muted-foreground">
            {ridesContent.roster.joined(formatDistanceToNow(new Date(signup.signed_up_at)))}
          </p>
        )}
      </div>
      {isLeader && (
        <Badge variant="default" className="text-xs">
          {ridesContent.roster.leader}
        </Badge>
      )}
      {signup.status === SignupStatus.WAITLISTED && signup.waitlist_position != null && (
        <Badge variant="warning" className="text-xs">
          #{signup.waitlist_position}
        </Badge>
      )}
    </Link>
  );
}

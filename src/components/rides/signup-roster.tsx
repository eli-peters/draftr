'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { DotsThree } from '@phosphor-icons/react/dist/ssr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { getInitials } from '@/lib/utils';
import { SignupStatus } from '@/config/statuses';
import { routes } from '@/config/routes';
import { useMotionPresets } from '@/lib/motion';

const { rides: ridesContent } = appContent;

export interface SignupEntry {
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
  currentUserId?: string | null;

  canRemoveRiders?: boolean;
  onRemoveRider?: (userId: string, userName: string) => void;
}

export function SignupRoster({
  signups,
  createdBy,
  coLeaderIds = [],
  currentUserId,

  canRemoveRiders,
  onRemoveRider,
}: SignupRosterProps) {
  if (signups.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
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

  // Admin view: split confirmed into leaders + riders subsections (no badges)
  // Non-admin view: flat list with Leader badges
  const confirmedLeaders = sortedConfirmed.filter((s) => leaderIds.has(s.user_id));
  const confirmedRiders = sortedConfirmed.filter((s) => !leaderIds.has(s.user_id));

  return (
    <div className="space-y-1">
      {canRemoveRiders ? (
        <>
          {confirmedLeaders.length > 0 && (
            <>
              <SectionHeading as="p" className="pb-1">
                {ridesContent.roster.leaders}
              </SectionHeading>
              <AnimatePresence initial={false} mode="popLayout">
                {confirmedLeaders.map((signup) => (
                  <SignupRow
                    key={signup.id}
                    signup={signup}
                    canRemove={signup.user_id !== createdBy && signup.user_id !== currentUserId}
                    onRemove={onRemoveRider}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
          {confirmedRiders.length > 0 && (
            <>
              <SectionHeading as="p" className="pb-1 pt-3">
                {ridesContent.roster.riders}
              </SectionHeading>
              <AnimatePresence initial={false} mode="popLayout">
                {confirmedRiders.map((signup) => (
                  <SignupRow
                    key={signup.id}
                    signup={signup}
                    canRemove={signup.user_id !== currentUserId}
                    onRemove={onRemoveRider}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
        </>
      ) : (
        <AnimatePresence initial={false} mode="popLayout">
          {sortedConfirmed.map((signup) => (
            <SignupRow key={signup.id} signup={signup} isLeader={leaderIds.has(signup.user_id)} />
          ))}
        </AnimatePresence>
      )}
      {waitlisted.length > 0 && (
        <>
          <SectionHeading as="p" className="pb-1 pt-3">
            {ridesContent.roster.waitlisted}
          </SectionHeading>
          <AnimatePresence initial={false} mode="popLayout">
            {waitlisted.map((signup) => (
              <SignupRow
                key={signup.id}
                signup={signup}
                isLeader={!canRemoveRiders && leaderIds.has(signup.user_id)}
                canRemove={
                  canRemoveRiders &&
                  signup.user_id !== createdBy &&
                  signup.user_id !== currentUserId
                }
                onRemove={onRemoveRider}
              />
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function SignupRow({
  signup,
  isLeader,
  canRemove,
  onRemove,
}: {
  signup: SignupEntry;
  isLeader?: boolean;
  canRemove?: boolean;
  onRemove?: (userId: string, userName: string) => void;
}) {
  const initials = getInitials(signup.user_name);
  const { listItem } = useMotionPresets();

  return (
    <motion.div
      layout
      layoutId={`signup-${signup.id}`}
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center gap-3 rounded-lg px-2 py-2"
    >
      <Link
        href={routes.publicProfile(signup.user_id)}
        className="flex flex-1 items-center gap-3 transition-colors hover:opacity-80"
      >
        <Avatar className="h-8 w-8">
          {signup.avatar_url && <AvatarImage src={signup.avatar_url} alt={signup.user_name} />}
          <AvatarFallback
            className={`text-xs font-medium ${getAvatarColourClasses(signup.user_name)}`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{signup.user_name}</p>
          {signup.signed_up_at && (
            <p className="text-xs text-muted-foreground">
              {ridesContent.roster.joined(formatDistanceToNow(new Date(signup.signed_up_at)))}
            </p>
          )}
        </div>
      </Link>
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

      {canRemove && onRemove && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={ridesContent.roster.removeConfirmTitle(signup.user_name)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <DotsThree className="h-4 w-4" weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRemove(signup.user_id, signup.user_name)}
            >
              {ridesContent.roster.removeRider}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}

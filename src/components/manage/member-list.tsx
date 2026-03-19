'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { appContent } from '@/content/app';
import { getInitials } from '@/lib/utils';
import {
  updateMemberRole,
  deactivateMember,
  reactivateMember,
  approveMember,
} from '@/lib/manage/actions';
import { MemberStatus } from '@/config/statuses';
import { separators } from '@/config/formatting';
import type { MemberRole } from '@/types/database';

const { manage: content } = appContent;

interface MemberData {
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  preferred_pace_group: string | null;
  role: string;
  status: string;
  joined_at: string;
}

interface MemberListProps {
  members: MemberData[];
  clubId: string;
  currentUserId: string;
}

type RoleFilter = 'all' | MemberRole;
type SortOption = 'alpha' | 'newest';

const roleOptions: { value: MemberRole; label: string }[] = [
  { value: 'rider', label: content.members.roles.rider },
  { value: 'ride_leader', label: content.members.roles.ride_leader },
  { value: 'admin', label: content.members.roles.admin },
];

const roleFilterOptions: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: content.memberActions.filterAll },
  ...roleOptions,
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'alpha', label: content.memberActions.sortAlpha },
  { value: 'newest', label: content.memberActions.sortNewest },
];

function sortMembers(members: MemberData[], sortBy: SortOption): MemberData[] {
  return [...members].sort((a, b) => {
    switch (sortBy) {
      case 'alpha': {
        const nameA = (a.display_name ?? a.full_name).toLowerCase();
        const nameB = (b.display_name ?? b.full_name).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      case 'newest':
        return b.joined_at.localeCompare(a.joined_at);
      default:
        return 0;
    }
  });
}

export function MemberList({ members, clubId, currentUserId }: MemberListProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('alpha');
  const [isPending, startTransition] = useTransition();

  // Filter by search + role
  const filtered = members.filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.display_name?.toLowerCase().includes(q) ?? false) ||
      m.email.toLowerCase().includes(q)
    );
  });

  // Group by status, then sort within groups (current user pinned in active)
  const pending = sortMembers(
    filtered.filter((m) => m.status === MemberStatus.PENDING),
    sortBy,
  );
  const activeFiltered = filtered.filter((m) => m.status === MemberStatus.ACTIVE);
  const currentUser = activeFiltered.find((m) => m.user_id === currentUserId);
  const otherActive = sortMembers(
    activeFiltered.filter((m) => m.user_id !== currentUserId),
    sortBy,
  );
  const active = currentUser ? [currentUser, ...otherActive] : otherActive;
  const inactive = sortMembers(
    filtered.filter((m) => m.status === MemberStatus.INACTIVE),
    sortBy,
  );

  function handleRoleChange(userId: string, newRole: MemberRole) {
    startTransition(async () => {
      await updateMemberRole(clubId, userId, newRole);
    });
  }

  function handleDeactivate(userId: string) {
    startTransition(async () => {
      await deactivateMember(clubId, userId);
    });
  }

  function handleReactivate(userId: string) {
    startTransition(async () => {
      await reactivateMember(clubId, userId);
    });
  }

  function handleApprove(userId: string) {
    startTransition(async () => {
      await approveMember(clubId, userId);
    });
  }

  return (
    <div className={isPending ? 'opacity-pending pointer-events-none' : ''}>
      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={content.memberActions.searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* Filter + Sort controls */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex flex-wrap gap-1.5">
          {roleFilterOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant={roleFilter === opt.value ? 'default' : 'outline'}
              size="lg"
              className="cursor-pointer"
              onClick={() => setRoleFilter(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {sortOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant={sortBy === opt.value ? 'default' : 'outline'}
              size="lg"
              className="cursor-pointer"
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warning mb-3">
            {content.members.status.pending} ({pending.length})
          </h3>
          {pending.map((member) => (
            <MemberRow
              key={member.user_id}
              member={member}
              isSelf={member.user_id === currentUserId}
              onRoleChange={handleRoleChange}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}

      {/* Active members */}
      {active.length > 0 && (
        <div className="mb-6">
          {active.map((member) => (
            <MemberRow
              key={member.user_id}
              member={member}
              isSelf={member.user_id === currentUserId}
              onRoleChange={handleRoleChange}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      )}

      {/* Inactive members */}
      {inactive.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {content.members.status.inactive} ({inactive.length})
          </h3>
          {inactive.map((member) => (
            <MemberRow
              key={member.user_id}
              member={member}
              isSelf={member.user_id === currentUserId}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isSelf = false,
  onRoleChange,
  onDeactivate,
  onReactivate,
  onApprove,
}: {
  member: MemberData;
  isSelf?: boolean;
  onRoleChange?: (userId: string, role: MemberRole) => void;
  onDeactivate?: (userId: string) => void;
  onReactivate?: (userId: string) => void;
  onApprove?: (userId: string) => void;
}) {
  const name = member.display_name ?? member.full_name;
  const initials = getInitials(member.full_name);
  const isInactive = member.status === MemberStatus.INACTIVE;
  const isPending = member.status === MemberStatus.PENDING;
  const roleKey = member.role as keyof typeof content.members.roles;
  const joinedFormatted = format(new Date(member.joined_at), 'MMM yyyy');

  // Build metadata line: pace group · Joined date
  const metaParts: string[] = [];
  if (member.preferred_pace_group) metaParts.push(member.preferred_pace_group);
  metaParts.push(content.memberActions.joinedDate(joinedFormatted));
  const metaLine = metaParts.join(separators.dot);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 mb-2 ${isInactive ? 'opacity-muted' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground truncate">
              {name}
              {isSelf && (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  ({content.members.you})
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
            <p className="text-xs text-muted-foreground/60 truncate">{metaLine}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPending && onApprove && (
            <Button size="sm" onClick={() => onApprove(member.user_id)}>
              {content.memberActions.approve}
            </Button>
          )}

          {!isInactive && !isPending && onRoleChange && !isSelf && (
            <Select
              value={member.role}
              onChange={(e) => onRoleChange(member.user_id, e.target.value as MemberRole)}
              selectSize="sm"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}

          {!isInactive && !isPending && isSelf && (
            <span className="text-sm font-medium text-muted-foreground">
              {content.members.roles[roleKey] ?? member.role}
            </span>
          )}

          {isPending && (
            <Badge variant="warning" className="text-sm">
              {content.members.status.pending}
            </Badge>
          )}

          {!isInactive && !isPending && onDeactivate && !isSelf && (
            <Button variant="destructive" size="sm" onClick={() => onDeactivate(member.user_id)}>
              {content.memberActions.deactivate}
            </Button>
          )}

          {isInactive && onReactivate && (
            <Button variant="outline" size="sm" onClick={() => onReactivate(member.user_id)}>
              {content.memberActions.reactivate}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterChip, FilterChipGroup } from '@/components/ui/filter-chip';
import { SectionHeading } from '@/components/ui/section-heading';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { appContent } from '@/content/app';
import { cn, getInitials } from '@/lib/utils';
import { routes } from '@/config/routes';
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
        const nameA = a.full_name.toLowerCase();
        const nameB = b.full_name.toLowerCase();
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
    return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
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
      {/* Search + Filter + Sort controls */}
      <div className="relative mb-3">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={content.memberActions.searchPlaceholder}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <FilterChipGroup
          value={[roleFilter]}
          onValueChange={(values: string[]) => {
            if (values.length > 0) setRoleFilter(values[0] as RoleFilter);
          }}
        >
          {roleFilterOptions.map((opt) => (
            <FilterChip key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </FilterChipGroup>

        <FilterChipGroup
          value={[sortBy]}
          onValueChange={(values: string[]) => {
            if (values.length > 0) setSortBy(values[0] as SortOption);
          }}
        >
          {sortOptions.map((opt) => (
            <FilterChip key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </FilterChipGroup>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-6 flex flex-col gap-4">
          <SectionHeading as="h3" className="text-warning">
            {content.members.status.pending} ({pending.length})
          </SectionHeading>
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
        <div className="mb-6 flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
          <SectionHeading as="h3">
            {content.members.status.inactive} ({inactive.length})
          </SectionHeading>
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
  const name = member.full_name;
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
    <Card className={cn('p-4', isInactive && 'opacity-muted')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            {member.avatar_url && <AvatarImage src={member.avatar_url} alt={name} />}
            <AvatarFallback className={`text-sm font-medium ${getAvatarColourClasses(name)}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground truncate">
              <Link href={routes.publicProfile(member.user_id)} className="hover:underline">
                {name}
              </Link>
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
              size="sm"
              value={member.role}
              onValueChange={(v) => onRoleChange(member.user_id, v as MemberRole)}
              items={Object.fromEntries(roleOptions.map((opt) => [opt.value, opt.label]))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
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
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import type { MemberRole } from '@/types/database';

const { manage: content } = appContent;

interface MemberData {
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
}

interface MemberListProps {
  members: MemberData[];
  clubId: string;
  currentUserId: string;
}

const roleOptions: { value: MemberRole; label: string }[] = [
  { value: 'rider', label: content.members.roles.rider },
  { value: 'ride_leader', label: content.members.roles.ride_leader },
  { value: 'admin', label: content.members.roles.admin },
];

const selectClass =
  'flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function MemberList({ members, clubId, currentUserId }: MemberListProps) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.display_name?.toLowerCase().includes(q) ?? false) ||
      m.email.toLowerCase().includes(q)
    );
  });

  const pending = filtered.filter((m) => m.status === 'pending');
  const active = filtered.filter((m) => m.status === 'active');
  const inactive = filtered.filter((m) => m.status === 'inactive');

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
    <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass
          weight="bold"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={content.memberActions.searchPlaceholder}
          className="pl-9"
        />
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
  const isInactive = member.status === 'inactive';
  const isPending = member.status === 'pending';
  const roleKey = member.role as keyof typeof content.members.roles;

  return (
    <div className={`rounded-xl border border-border bg-card p-4 mb-2 ${isInactive ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPending && onApprove && (
            <Button size="sm" onClick={() => onApprove(member.user_id)}>
              {content.memberActions.approve}
            </Button>
          )}

          {!isInactive && !isPending && onRoleChange && !isSelf && (
            <select
              value={member.role}
              onChange={(e) => onRoleChange(member.user_id, e.target.value as MemberRole)}
              className={selectClass}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {!isInactive && !isPending && isSelf && (
            <span className="text-sm font-medium text-muted-foreground">
              {content.members.roles[roleKey] ?? member.role}
            </span>
          )}

          {isPending && (
            <Badge variant="outline" className="text-sm border-warning/50 text-warning">
              {content.members.status.pending}
            </Badge>
          )}

          {!isInactive && !isPending && onDeactivate && !isSelf && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDeactivate(member.user_id)}
            >
              {content.memberActions.deactivate}
            </Button>
          )}

          {isInactive && onReactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(member.user_id)}
            >
              {content.memberActions.reactivate}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

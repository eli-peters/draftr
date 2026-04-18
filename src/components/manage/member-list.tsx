'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DotsThree } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPresets } from '@/lib/motion';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminFilterToolbar, type FilterDefinition } from './admin-filter-toolbar';
import { TablePagination } from './table-pagination';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { formatPhoneDisplay } from '@/lib/phone';
import { appContent } from '@/content/app';
import { cn, getInitials } from '@/lib/utils';
import { routes } from '@/config/routes';
import { getPaceBadgeVariant } from '@/config/formatting';
import {
  updateMemberRole,
  deactivateMember,
  reactivateMember,
  approveMember,
} from '@/lib/manage/actions';
import { SortableHeader, type SortDir } from '@/components/manage/sortable-header';
import { MemberStatus } from '@/config/statuses';
import type { MemberRole } from '@/types/database';

const { manage: content } = appContent;

interface MemberData {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone_number: string | null;
  preferred_pace_group: string | null;
  role: string;
  status: string;
  joined_at: string;
  membership: {
    member_number: string | null;
    membership_type: string | null;
    status: string | null;
  } | null;
}

interface PaceGroupInfo {
  id: string;
  name: string;
  sort_order: number;
}

interface MemberListProps {
  members: MemberData[];
  clubId: string;
  currentUserId: string;
  paceGroups?: PaceGroupInfo[];
}

type RoleFilter = 'all' | MemberRole;
type StatusFilter = 'all' | 'active' | 'pending' | 'inactive';
type MemberSortKey = 'name' | 'role' | 'paceGroup' | 'joined' | 'status';

const roleOptions: { value: MemberRole; label: string }[] = [
  { value: 'rider', label: content.members.roles.rider },
  { value: 'ride_leader', label: content.members.roles.ride_leader },
  { value: 'admin', label: content.members.roles.admin },
];

const roleOrder: Record<string, number> = { rider: 0, ride_leader: 1, admin: 2 };
const statusOrder: Record<string, number> = { pending: 0, active: 1, inactive: 2 };

function compareMembers(a: MemberData, b: MemberData, key: MemberSortKey, dir: SortDir): number {
  const m = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'name':
      return a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase()) * m;
    case 'role':
      return ((roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99)) * m;
    case 'paceGroup':
      return (a.preferred_pace_group ?? '').localeCompare(b.preferred_pace_group ?? '') * m;
    case 'joined':
      return a.joined_at.localeCompare(b.joined_at) * m;
    case 'status':
      return ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) * m;
    default:
      return 0;
  }
}

export function MemberList({ members, clubId, currentUserId, paceGroups = [] }: MemberListProps) {
  const router = useRouter();
  const { listItem } = useMotionPresets();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<MemberSortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [isPending, startTransition] = useTransition();
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const pendingCount = members.filter((m) => m.status === MemberStatus.PENDING).length;

  // Build pace group name → sort_order map for badge colouring
  const paceGroupMap = useMemo(
    () => new Map(paceGroups.map((pg) => [pg.name, pg.sort_order])),
    [paceGroups],
  );

  function handleSort(key: MemberSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const displayMembers = useMemo(() => {
    let filtered = members;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((m) => m.status === MemberStatus.ACTIVE);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((m) => m.status === MemberStatus.PENDING);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((m) => m.status === MemberStatus.INACTIVE);
    } else {
      filtered = filtered.filter((m) => m.status !== MemberStatus.INACTIVE);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
      );
    }

    const sorted = [...filtered].sort((a, b) => compareMembers(a, b, sortKey, sortDir));
    const currentUser = sorted.find((m) => m.user_id === currentUserId);
    const others = sorted.filter((m) => m.user_id !== currentUserId);
    return currentUser ? [currentUser, ...others] : others;
  }, [members, roleFilter, statusFilter, search, sortKey, sortDir, currentUserId]);

  const paginatedMembers = displayMembers.slice(page * pageSize, (page + 1) * pageSize);

  const roleFilterDef: FilterDefinition = {
    key: 'role',
    label: content.memberActions.roleColumn,
    defaultValue: 'all',
    options: [
      { value: 'all', label: content.memberActions.filterAll },
      { value: 'rider', label: content.memberActions.filterRiders },
      { value: 'ride_leader', label: content.memberActions.filterLeaders },
      { value: 'admin', label: content.memberActions.filterAdmins },
    ],
  };

  const statusFilterDef: FilterDefinition = {
    key: 'status',
    label: content.memberActions.statusColumn,
    defaultValue: 'all',
    options: [
      { value: 'all', label: content.memberActions.filterAll },
      { value: 'active', label: content.members.status.active },
      {
        value: 'pending',
        label:
          pendingCount > 0
            ? content.memberActions.filterPending(pendingCount)
            : content.members.status.pending,
      },
      { value: 'inactive', label: content.memberActions.filterInactive },
    ],
  };

  const filterValues: Record<string, string> = {
    role: roleFilter,
    status: statusFilter,
  };

  function handleFilterChange(key: string, value: string) {
    if (key === 'role') setRoleFilter(value as RoleFilter);
    if (key === 'status') setStatusFilter(value as StatusFilter);
    setPage(0);
  }

  function handleRoleChange(userId: string, newRole: MemberRole) {
    setEditingRoleUserId(null);
    startTransition(async () => {
      const result = await updateMemberRole(clubId, userId, newRole);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleDeactivate(userId: string) {
    startTransition(async () => {
      const result = await deactivateMember(clubId, userId);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleReactivate(userId: string) {
    startTransition(async () => {
      const result = await reactivateMember(clubId, userId);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleApprove(userId: string) {
    startTransition(async () => {
      const result = await approveMember(clubId, userId);
      if (result?.error) toast.error(result.error);
    });
  }

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className={isPending ? 'opacity-pending pointer-events-none' : ''}>
      <div className="mb-3">
        <AdminFilterToolbar
          filters={[roleFilterDef, statusFilterDef]}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          searchPlaceholder={content.memberActions.searchPlaceholder}
        />
      </div>

      {displayMembers.length === 0 ? (
        <EmptyState
          title={content.memberActions.noMembers}
          description={content.memberActions.noFilterResults}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="overflow-x-auto rounded-md border border-(--border-default)">
            <table className="w-full bg-(--surface-default) text-left">
              <thead>
                <tr className="border-b border-(--border-default) bg-(--surface-sunken)">
                  <SortableHeader
                    label={content.memberActions.memberColumn}
                    sortKey="name"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.memberActions.roleColumn}
                    sortKey="role"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.memberActions.statusColumn}
                    sortKey="status"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.memberActions.paceGroupColumn}
                    sortKey="paceGroup"
                    {...sortProps}
                  />
                  <SortableHeader
                    label={content.memberActions.joinedColumn}
                    sortKey="joined"
                    {...sortProps}
                  />
                  <th className="p-3 text-overline font-sans text-(--text-secondary)">
                    {content.memberActions.emailColumn}
                  </th>
                  <th className="hidden p-3 text-overline font-sans text-(--text-secondary) lg:table-cell">
                    {content.memberActions.phoneColumn}
                  </th>
                  <th className="hidden p-3 text-overline font-sans text-(--text-secondary) xl:table-cell">
                    {content.memberActions.ccnColumn}
                  </th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {paginatedMembers.map((member) => {
                    const isSelf = member.user_id === currentUserId;
                    const isInactive = member.status === MemberStatus.INACTIVE;
                    const isPendingMember = member.status === MemberStatus.PENDING;
                    const name = member.full_name;
                    const initials = getInitials(name);
                    const joinedFormatted = format(new Date(member.joined_at), 'MMM yyyy');
                    const roleKey = member.role as keyof typeof content.members.roles;
                    const canEditRole = !isInactive && !isPendingMember && !isSelf;

                    let statusText = '';
                    let statusClass = '';
                    if (isPendingMember) {
                      statusText = content.members.status.pending;
                      statusClass = 'text-(--feedback-warning-text)';
                    } else if (isInactive) {
                      statusText = content.members.status.inactive;
                      statusClass = 'text-(--text-tertiary)';
                    } else {
                      statusText = content.members.status.active;
                    }

                    // Pace group badge
                    const pgSortOrder = member.preferred_pace_group
                      ? paceGroupMap.get(member.preferred_pace_group)
                      : undefined;

                    function handleRowClick() {
                      router.push(routes.publicProfile(member.user_id));
                    }

                    function handleRowKeyDown(e: React.KeyboardEvent) {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick();
                      }
                    }

                    return (
                      <motion.tr
                        key={member.user_id}
                        layout
                        variants={listItem}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={handleRowClick}
                        onKeyDown={handleRowKeyDown}
                        tabIndex={0}
                        role="link"
                        className={cn(
                          'group cursor-pointer border-b border-(--border-subtle) last:border-b-0 even:bg-(--surface-page) hover:bg-(--action-primary-subtle-bg)',
                          isInactive && 'opacity-muted',
                        )}
                      >
                        {/* Member — avatar + name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-6 w-6 shrink-0">
                              {member.avatar_url && (
                                <AvatarImage src={member.avatar_url} alt={name} />
                              )}
                              <AvatarFallback
                                className={`text-[10px] font-medium ${getAvatarColourClasses(name)}`}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <p className="min-w-0 truncate font-sans text-xs font-medium text-(--text-primary)">
                              {name}
                              {isSelf && (
                                <span className="ml-1 text-xs font-normal text-(--text-tertiary)">
                                  ({content.members.you})
                                </span>
                              )}
                            </p>
                          </div>
                        </td>

                        {/* Role — click-to-edit via kebab or inline */}
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          {editingRoleUserId === member.user_id ? (
                            <Select
                              size="sm"
                              value={member.role}
                              onValueChange={(v) =>
                                handleRoleChange(member.user_id, v as MemberRole)
                              }
                              items={Object.fromEntries(
                                roleOptions.map((opt) => [opt.value, opt.label]),
                              )}
                            >
                              <SelectTrigger className="h-7 text-xs" autoFocus>
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
                          ) : (
                            <span className="font-sans text-xs text-(--text-secondary)">
                              {content.members.roles[roleKey] ?? member.role}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className={cn('p-3 font-sans text-xs', statusClass)}>{statusText}</td>

                        {/* Pace Group — coloured badge */}
                        <td className="p-3">
                          {member.preferred_pace_group && pgSortOrder != null ? (
                            <Badge variant={getPaceBadgeVariant(pgSortOrder)} size="sm">
                              {member.preferred_pace_group}
                            </Badge>
                          ) : (
                            <span className="font-sans text-xs text-(--text-tertiary)">—</span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="p-3 font-sans text-xs text-(--text-primary)">
                          {joinedFormatted}
                        </td>

                        {/* Email */}
                        <td className="max-w-[200px] truncate p-3 font-sans text-xs text-(--text-secondary)">
                          {member.email}
                        </td>

                        {/* Phone — responsive, lg+ only */}
                        <td className="hidden p-3 font-sans text-xs text-(--text-secondary) lg:table-cell">
                          {member.phone_number ? formatPhoneDisplay(member.phone_number) : '—'}
                        </td>

                        {/* CCN # — xl+ only */}
                        <td className="hidden p-3 font-sans text-xs text-(--text-secondary) xl:table-cell">
                          {member.membership?.member_number ?? '—'}
                        </td>

                        {/* Kebab menu — always visible */}
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          {isPendingMember ? (
                            <Button size="sm" onClick={() => handleApprove(member.user_id)}>
                              {content.memberActions.approve}
                            </Button>
                          ) : !isSelf ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-(--action-primary-subtle-bg) hover:text-(--text-primary)">
                                <DotsThree className="h-4 w-4" weight="bold" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditRole && (
                                  <DropdownMenuItem
                                    onClick={() => setEditingRoleUserId(member.user_id)}
                                  >
                                    {content.memberActions.editRole}
                                  </DropdownMenuItem>
                                )}
                                {!isInactive && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeactivate(member.user_id)}
                                  >
                                    {content.memberActions.deactivate}
                                  </DropdownMenuItem>
                                )}
                                {isInactive && (
                                  <DropdownMenuItem
                                    onClick={() => handleReactivate(member.user_id)}
                                  >
                                    {content.memberActions.reactivate}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            <TablePagination
              totalItems={displayMembers.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}
    </div>
  );
}

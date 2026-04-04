'use client';

import { UsersThree, Check } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { RiderAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import type { LeaderConflict } from '@/lib/rides/actions';

const form = appContent.rides.form;

interface StepCoLeadersProps {
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  selectedCoLeaders: string[];
  coLeaderConflicts: LeaderConflict[];
  onToggleCoLeader: (userId: string) => void;
}

export function StepCoLeaders({
  eligibleLeaders,
  selectedCoLeaders,
  coLeaderConflicts,
  onToggleCoLeader,
}: StepCoLeadersProps) {
  const sortByFirstName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name);

  const available = eligibleLeaders
    .filter((l) => !coLeaderConflicts.some((c) => c.user_id === l.user_id))
    .sort(sortByFirstName);

  const unavailable = eligibleLeaders
    .filter((l) => coLeaderConflicts.some((c) => c.user_id === l.user_id))
    .sort(sortByFirstName);

  return (
    <ContentCard padding="default" heading={form.sectionCoLeaders} icon={UsersThree}>
      <div className="flex flex-col gap-5 md:gap-6">
        {eligibleLeaders.length > 0 && (
          <div className="flex flex-col gap-1">
            {available.map((leader) => {
              const isSelected = selectedCoLeaders.includes(leader.user_id);
              return (
                <button
                  key={leader.user_id}
                  type="button"
                  onClick={() => onToggleCoLeader(leader.user_id)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                >
                  <div className="relative">
                    <RiderAvatar
                      avatarUrl={leader.avatar_url}
                      name={leader.name}
                      className={isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                    />
                    {isSelected && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" weight="bold" />
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'flex-1 min-w-0 text-left text-sm truncate',
                      isSelected ? 'font-medium text-foreground' : 'text-foreground',
                    )}
                  >
                    {leader.name}
                  </p>
                </button>
              );
            })}

            {unavailable.length > 0 && (
              <>
                <div className="border-t border-border-subtle my-1" />
                {unavailable.map((leader) => {
                  const conflict = coLeaderConflicts.find((c) => c.user_id === leader.user_id);
                  const reason =
                    conflict?.reason === 'cancelled'
                      ? form.coLeadersCancelled
                      : form.coLeadersUnavailable;
                  return (
                    <div
                      key={leader.user_id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 grayscale"
                    >
                      <div className="relative">
                        <RiderAvatar avatarUrl={leader.avatar_url} name={leader.name} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm truncate text-muted-foreground">{leader.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{reason}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </ContentCard>
  );
}

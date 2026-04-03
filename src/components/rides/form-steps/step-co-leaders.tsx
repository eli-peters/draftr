'use client';

import { useState } from 'react';
import { UsersThree, Check, Prohibit, X, Plus } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { filterChipVariants } from '@/components/ui/filter-chip';
import { Label } from '@/components/ui/label';
import { SectionHeading } from '@/components/ui/section-heading';
import { RiderAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import type { LeaderConflict } from '@/lib/rides/actions';

const form = appContent.rides.form;

interface StepCoLeadersProps {
  isEdit: boolean;
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  selectedCoLeaders: string[];
  coLeaderConflicts: LeaderConflict[];
  onToggleCoLeader: (userId: string) => void;
  signupCount?: number;
  children?: React.ReactNode;
}

export function StepCoLeaders({
  isEdit,
  eligibleLeaders,
  selectedCoLeaders,
  coLeaderConflicts,
  onToggleCoLeader,
  signupCount,
  children,
}: StepCoLeadersProps) {
  const [showCoLeaderList, setShowCoLeaderList] = useState(selectedCoLeaders.length > 0);

  const selectedLeaders = eligibleLeaders.filter((l) => selectedCoLeaders.includes(l.user_id));

  return (
    <ContentCard
      padding="default"
      heading={form.sectionCoLeaders}
      icon={<UsersThree weight="duotone" className="size-6 text-primary" />}
    >
      <div className="flex flex-col gap-5">
        {eligibleLeaders.length > 0 && (
          <div className="space-y-3">
            {selectedLeaders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLeaders.map((leader) => (
                  <span
                    key={leader.user_id}
                    className={filterChipVariants({ variant: 'display', size: 'default' })}
                  >
                    <span>{leader.name}</span>
                    <button
                      type="button"
                      onClick={() => onToggleCoLeader(leader.user_id)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                    >
                      <X className="size-3.5" weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showCoLeaderList ? (
              <div className="space-y-1">
                <Label>{form.coLeaders}</Label>
                <div className="flex flex-col gap-1">
                  {eligibleLeaders.map((leader) => {
                    const isSelected = selectedCoLeaders.includes(leader.user_id);
                    const conflict = coLeaderConflicts.find((c) => c.user_id === leader.user_id);
                    const hasConflict = !!conflict;
                    return (
                      <button
                        key={leader.user_id}
                        type="button"
                        disabled={hasConflict}
                        onClick={() => onToggleCoLeader(leader.user_id)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                          hasConflict ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/50',
                        )}
                      >
                        <div className={`relative ${hasConflict ? 'grayscale' : ''}`}>
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
                          {hasConflict && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <Prohibit className="size-2.5" weight="bold" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p
                            className={cn(
                              'text-sm truncate',
                              isSelected
                                ? 'font-medium text-foreground'
                                : hasConflict
                                  ? 'text-muted-foreground'
                                  : 'text-foreground',
                            )}
                          >
                            {leader.name}
                          </p>
                          {hasConflict && (
                            <p className="text-xs text-muted-foreground truncate">
                              {form.coLeadersUnavailable}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary transition-colors hover:text-primary/80"
                onClick={() => setShowCoLeaderList(true)}
              >
                <Plus className="size-4" weight="bold" />
                {form.addCoLeader}
              </button>
            )}
          </div>
        )}

        {isEdit && children && (
          <div className="space-y-3">
            <SectionHeading as="p">
              {appContent.rides.edit.signups}
              {signupCount != null && ` — ${signupCount} confirmed`}
            </SectionHeading>
            {children}
          </div>
        )}
      </div>
    </ContentCard>
  );
}

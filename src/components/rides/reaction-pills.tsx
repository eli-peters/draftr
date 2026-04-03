'use client';

import { useOptimistic, useTransition } from 'react';
import { Plus, Smiley } from '@phosphor-icons/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { REACTION_CONFIG, REACTION_ORDER } from '@/config/reactions';
import { appContent } from '@/content/app';
import { cn } from '@/lib/utils';
import type { ReactionType, ReactionSummary } from '@/types/database';

const content = appContent.rides.reactions;

interface ReactionPillsProps {
  reactions: ReactionSummary[];
  onToggle: (reaction: ReactionType) => Promise<unknown>;
  currentUserId: string | null;
}

export function ReactionPills({ reactions, onToggle, currentUserId }: ReactionPillsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticReactions, addOptimistic] = useOptimistic(
    reactions,
    (state: ReactionSummary[], toggledReaction: ReactionType) => {
      const existing = state.find((r) => r.reaction === toggledReaction);
      if (existing?.hasReacted) {
        // Remove user's reaction
        const updated = {
          ...existing,
          count: existing.count - 1,
          hasReacted: false,
        };
        return updated.count === 0
          ? state.filter((r) => r.reaction !== toggledReaction)
          : state.map((r) => (r.reaction === toggledReaction ? updated : r));
      }
      if (existing) {
        // Add to existing reaction
        return state.map((r) =>
          r.reaction === toggledReaction ? { ...r, count: r.count + 1, hasReacted: true } : r,
        );
      }
      // New reaction
      return [...state, { reaction: toggledReaction, count: 1, userNames: [], hasReacted: true }];
    },
  );

  function handleToggle(reaction: ReactionType) {
    startTransition(async () => {
      addOptimistic(reaction);
      await onToggle(reaction);
    });
  }

  // Sort pills by REACTION_ORDER
  const sorted = [...optimisticReactions].sort(
    (a, b) => REACTION_ORDER.indexOf(a.reaction) - REACTION_ORDER.indexOf(b.reaction),
  );

  if (!currentUserId) {
    // Read-only: just show existing reactions
    if (sorted.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((r) => (
          <span
            key={r.reaction}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs"
            title={content.reactedBy(r.userNames)}
          >
            <span>{REACTION_CONFIG[r.reaction].emoji}</span>
            <span className="tabular-nums text-muted-foreground">{r.count}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map((r) => (
        <button
          key={r.reaction}
          onClick={() => handleToggle(r.reaction)}
          disabled={isPending}
          title={content.reactedBy(r.userNames)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-1 transition-colors',
            r.hasReacted
              ? 'border-primary bg-action-primary-subtle-bg text-primary'
              : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-action-primary-subtle-bg/50',
          )}
        >
          <span className="text-sm">{REACTION_CONFIG[r.reaction].emoji}</span>
          <span className="text-xs tabular-nums">{r.count}</span>
        </button>
      ))}
      <ReactionPicker onSelect={handleToggle} disabled={isPending} />
    </div>
  );
}

function ReactionPicker({
  onSelect,
  disabled,
}: {
  onSelect: (reaction: ReactionType) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={content.addReaction}
        className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-action-primary-subtle-bg hover:text-primary"
      >
        <span className="relative">
          <Smiley className="size-4" weight="fill" />
          <Plus
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-background"
            weight="bold"
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1.5">
        <div className="flex gap-1">
          {REACTION_ORDER.map((reaction) => (
            <button
              key={reaction}
              onClick={() => onSelect(reaction)}
              aria-label={REACTION_CONFIG[reaction].label}
              className="rounded-md p-2 text-xl transition-transform hover:scale-110 hover:bg-accent active:scale-95"
            >
              {REACTION_CONFIG[reaction].emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

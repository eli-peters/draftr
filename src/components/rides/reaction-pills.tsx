'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Smiley } from '@phosphor-icons/react';
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
            'inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border px-3 transition-colors duration-(--duration-fast) active:scale-95',
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
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={content.addReaction}
        className="inline-flex h-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-border px-3 text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary hover:bg-action-primary-subtle-bg hover:text-primary"
      >
        <Smiley className="size-4 opacity-50" weight="regular" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1.5">
        <div className="flex gap-1">
          {REACTION_ORDER.map((reaction) => (
            <button
              key={reaction}
              onClick={() => {
                setOpen(false);
                requestAnimationFrame(() => onSelect(reaction));
              }}
              aria-label={REACTION_CONFIG[reaction].label}
              className="cursor-pointer rounded-md p-2 text-xl transition-[transform,background-color] duration-(--duration-fast) hover:bg-accent active:scale-95"
            >
              {REACTION_CONFIG[reaction].emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import type { ReactionType } from '@/types/database';

interface ReactionConfig {
  emoji: string;
  label: string;
}

export const REACTION_CONFIG: Record<ReactionType, ReactionConfig> = {
  thumbs_up: { emoji: '👍', label: 'Thumbs up' },
  fire: { emoji: '🔥', label: 'Fire' },
  heart: { emoji: '❤️', label: 'Love' },
  laugh: { emoji: '😂', label: 'Haha' },
  cycling: { emoji: '🚴', label: 'Cycling' },
};

export const REACTION_ORDER: ReactionType[] = ['thumbs_up', 'fire', 'heart', 'laugh', 'cycling'];

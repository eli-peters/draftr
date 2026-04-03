'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { cn, getInitials } from '@/lib/utils';
import { getAvatarColour } from '@/lib/avatar-colours';

// ---------------------------------------------------------------------------
// Core Avatar primitives (used across the app: profiles, comments, roster)
// ---------------------------------------------------------------------------

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar relative flex size-8 shrink-0 rounded-full select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border-2 after:border-border data-[size=lg]:size-10 data-[size=sm]:size-6',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full rounded-full object-cover', className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground group-data-[size=sm]/avatar:text-micro',
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-action-secondary-subtle-bg text-sm text-action-secondary-subtle-text ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Rider avatar components — for ride card contexts
//
// These use accent-coloured backgrounds for fallbacks and are designed to
// stack with overlap. The "border" between stacked circles is created by
// each circle having a 2px border that inherits the parent surface colour,
// so the stack works on any background without hardcoding a colour.
// ---------------------------------------------------------------------------

/**
 * Single rider avatar circle — matches the roster/detail page avatar exactly.
 *
 * Initials fallback: coloured bg + accent border + accent text (font-medium).
 * Photo: clipped image with subtle border overlay.
 *
 * When placed inside a RiderAvatarStack, an outer ring in the surface colour
 * is applied via the stack's CSS to create visual padding between overlaps.
 */
interface RiderAvatarProps {
  avatarUrl: string | null;
  name: string;
  className?: string;
}

function RiderAvatar({ avatarUrl, name, className }: RiderAvatarProps) {
  const [bg, fg] = getAvatarColour(name);
  return (
    <div
      data-slot="rider-avatar"
      className={cn('relative size-8 shrink-0 rounded-full', !avatarUrl && bg, className)}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="size-full rounded-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <span className={cn('text-xs font-medium', fg)}>{getInitials(name)}</span>
        </div>
      )}
      {/* Consistent border overlay — renders on top of both photos and initials */}
      <span className="absolute inset-0 rounded-full border border-border" />
    </div>
  );
}

/** Overflow count circle (+X) — subtle secondary tint with accent border. */
interface RiderAvatarOverflowProps {
  count: number;
  className?: string;
}

function RiderAvatarOverflow({ count, className }: RiderAvatarOverflowProps) {
  return (
    <div
      data-slot="rider-avatar"
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-action-secondary-subtle-bg',
        className,
      )}
    >
      <span className="text-xs font-medium text-action-secondary-subtle-text">+{count}</span>
    </div>
  );
}

/**
 * Overlapping avatar stack for ride cards.
 *
 * Adds a 2px ring in the parent surface colour around each child avatar,
 * creating visual padding between the overlapping circles. The ring colour
 * is set via `--stack-ring` and defaults to `var(--surface-page)` (card footer).
 */
interface RiderAvatarStackProps {
  children: React.ReactNode;
  /** CSS value for the ring colour. Defaults to var(--surface-page). */
  surface?: string;
  className?: string;
}

function RiderAvatarStack({ children, surface, className }: RiderAvatarStackProps) {
  return (
    <div
      data-slot="rider-avatar-stack"
      className={cn(
        'flex -space-x-2 *:data-[slot=rider-avatar]:ring-2 *:data-[slot=rider-avatar]:ring-(--stack-ring)',
        className,
      )}
      style={{ '--stack-ring': surface ?? 'var(--surface-page)' } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
  RiderAvatar,
  RiderAvatarOverflow,
  RiderAvatarStack,
};

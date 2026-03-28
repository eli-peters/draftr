/**
 * Deterministic avatar colour assignment.
 *
 * Pure utility — no React, works in both server and client contexts.
 * Uses avatar semantic tokens (avatar-{1-6}-{bg,fg}).
 *
 * fg is used for text colour only. Borders use border-border (neutral)
 * to match the base Avatar component's subtle stroke.
 */

const AVATAR_COLOURS: [bg: string, fg: string][] = [
  ['bg-avatar-1-bg', 'text-avatar-1-fg'],
  ['bg-avatar-2-bg', 'text-avatar-2-fg'],
  ['bg-avatar-3-bg', 'text-avatar-3-fg'],
  ['bg-avatar-4-bg', 'text-avatar-4-fg'],
  ['bg-avatar-5-bg', 'text-avatar-5-fg'],
  ['bg-avatar-6-bg', 'text-avatar-6-fg'],
];

/** Simple string hash → stable index into the colour palette. */
function nameToColourIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_COLOURS.length;
}

/** Returns [bgClass, fgClass] tuple for a given name. */
export function getAvatarColour(name: string): [bg: string, fg: string] {
  return AVATAR_COLOURS[nameToColourIndex(name)];
}

/**
 * Returns bg + text colour classes for AvatarFallback usage.
 * `<AvatarFallback className={getAvatarColourClasses(name)}>`
 */
export function getAvatarColourClasses(name: string): string {
  const [bg, fg] = AVATAR_COLOURS[nameToColourIndex(name)];
  return `${bg} ${fg}`;
}

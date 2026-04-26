/**
 * Capitalizes the first alphabetic character in `text`, leaving the rest
 * untouched. Skips leading whitespace and punctuation. Returns an empty
 * string for nullish input. Used at the render layer for free-form UGC
 * (ride descriptions, bios) so the original stored value stays intact.
 */
export function capitalizeFirst(text: string | null | undefined): string {
  if (!text) return '';

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (/\p{L}/u.test(ch)) {
      const upper = ch.toUpperCase();
      if (upper === ch) return text;
      return text.slice(0, i) + upper + text.slice(i + 1);
    }
  }

  return text;
}

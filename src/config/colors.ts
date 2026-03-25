import primitives from '@/tokens/primitives.json';

/** Colors needed by metadata/manifest — sourced from the token pipeline */
export const metaColors = {
  themeLight: primitives.color.primary[500].$value,
  themeDark: primitives.color.neutral[950].$value,
  background: primitives.color.neutral[950].$value,
} as const;

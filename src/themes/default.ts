import type { ClubTheme } from '@/types/theme';
import primitives from '@/tokens/primitives.json';

export const defaultTheme: ClubTheme = {
  slug: 'draftr',
  name: 'Draftr',
  colors: {
    primary: primitives.color.primary[500].$value,
    secondary: primitives.color.secondary[500].$value,
  },
};

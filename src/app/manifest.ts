import type { MetadataRoute } from 'next';
import { metaColors } from '@/config/colors';
import { appContent } from '@/content/app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appContent.meta.title,
    short_name: appContent.meta.shortName,
    description: appContent.meta.description,
    start_url: '/',
    display: 'standalone',
    background_color: metaColors.background,
    theme_color: metaColors.themeLight,
    orientation: 'portrait-primary',
    categories: ['sports', 'fitness'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any' as const,
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any' as const,
      },
    ],
  };
}

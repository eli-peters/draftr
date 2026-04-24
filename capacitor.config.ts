import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.draftr',
  appName: 'Draftr',
  webDir: 'public',
  server: {
    url: 'https://go.draftr.app',
    allowNavigation: ['*.supabase.co'],
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;

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
    contentInset: 'never',
    backgroundColor: '#ffffff',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'DEFAULT',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

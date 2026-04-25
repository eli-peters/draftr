import type { CapacitorConfig } from '@capacitor/cli';

/*
 * Splash screen — appearance handling
 * -----------------------------------
 * The launch screen is storyboard-driven (ios/App/App/Base.lproj/LaunchScreen.storyboard
 * → image "Splash" in Assets.xcassets/Splash.imageset). Two ways to handle dark mode:
 *
 * Option A (active): two-asset approach. Splash.imageset has light + dark
 *   appearance variants wired in Contents.json. iOS picks the right one based
 *   on system appearance. To finalize, replace the dark PNGs
 *   (Default@{1,2,3}x~universal~anyany-dark.png) with the true dark-mode logo
 *   when delivered. No code change required.
 *
 * Option B: single-asset approach. Pin LaunchScreen to a fixed light background
 *   regardless of system appearance — set `overrideUserInterfaceStyle = .light`
 *   on the launch view controller and a hard-coded background colour in the
 *   storyboard, then drop the dark variants from Contents.json. Keeps one logo
 *   file across modes at the cost of always-light splash.
 *
 * The Capacitor SplashScreen plugin (JS overlay shown after the storyboard)
 * is intentionally not configured here — the storyboard splash is the only
 * splash surface today.
 */
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

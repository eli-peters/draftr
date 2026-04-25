import type { Metadata, Viewport } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { NativeBridge } from '@/components/native-bridge';
import { Toaster } from '@/components/ui/sonner';
import { COLOR_MODE_SCRIPT } from '@/lib/color-mode-script';
import { metaColors } from '@/config/colors';
import { appContent } from '@/content/app';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: metaColors.themeLight },
    { media: '(prefers-color-scheme: dark)', color: metaColors.themeDark },
  ],
};

export const metadata: Metadata = {
  title: appContent.meta.title,
  description: appContent.meta.description,

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: appContent.meta.shortName,
  },
  openGraph: {
    title: appContent.meta.title,
    description: appContent.meta.description,
    type: 'website',
  },
  icons: {
    icon: [{ url: '/icons/favicon.png', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <NativeBridge />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

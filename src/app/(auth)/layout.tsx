import { AppLogo } from '@/components/layout/app-logo';
import { appContent } from '@/content/app';

/**
 * Auth layout — no navigation shell. Wordmark + tagline weighted at the top
 * third, form sits just below. Replaces the prior fully-centered layout
 * which left the upper viewport empty and made the Sign In CTA feel
 * bottom-heavy on mobile.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 pt-[18vh] pb-12">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <AppLogo className="h-8 w-auto text-primary" />
        <p className="text-sm text-muted-foreground">{appContent.auth.signIn.tagline}</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

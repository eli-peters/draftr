import { AppShell } from "@/components/layout/app-shell";
import { getNavForRole } from "@/config/navigation";
import { appContent } from "@/content/app";

/**
 * Authenticated app layout with navigation shell.
 * TODO: Replace hardcoded role with actual user role from Supabase session.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get actual role from Supabase auth session
  const userRole = "rider" as const;
  const navItems = getNavForRole(userRole);

  return (
    <AppShell navItems={navItems} appName={appContent.meta.shortName}>
      {children}
    </AppShell>
  );
}

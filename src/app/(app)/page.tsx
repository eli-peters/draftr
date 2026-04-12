import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserClubMembership } from '@/lib/rides/queries';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting';
import { DashboardActionContent } from '@/components/dashboard/dashboard-action-content';
import { CurrentWeather } from '@/components/weather/current-weather';
import type { UserRole } from '@/config/navigation';
import type { Club } from '@/types/database';

export default async function HomePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = (membership.club as unknown as Club).timezone;
  const userRole = membership.role as UserRole;

  return (
    <DashboardShell>
      {/* Greeting streams first — only needs the user's name */}
      <Suspense
        fallback={
          <div className="relative mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-9 w-56 skeleton-shimmer" />
            </div>
          </div>
        }
      >
        <DashboardGreeting userId={membership.user_id} className="mb-8 mt-0 md:mt-0 md:mb-10" />
      </Suspense>

      {/* Weather widget — client component, uses browser geolocation, renders immediately */}
      <div>
        <CurrentWeather />
      </div>

      {/* Action cards stream after ride queries resolve */}
      <Suspense
        fallback={
          <div className="mt-8 space-y-3">
            <div className="h-24 skeleton-shimmer rounded-(--card-radius)" />
          </div>
        }
      >
        <DashboardActionContent
          userId={membership.user_id}
          clubId={membership.club_id}
          timezone={timezone}
          userRole={userRole}
        />
      </Suspense>
    </DashboardShell>
  );
}

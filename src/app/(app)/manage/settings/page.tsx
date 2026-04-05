import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { getUserClubMembership } from '@/lib/rides/queries';
import { getPaceTiersWithUsage } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { SeasonDatesSection } from '@/components/manage/season-dates-section';
import { PaceTiersSection } from '@/components/manage/pace-tiers-section';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManageSettingsPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'admin') redirect(routes.manage);

  const supabase = await createClient();
  const { data: club } = await supabase
    .from('clubs')
    .select('settings')
    .eq('id', membership.club_id)
    .single();
  const clubSettings = (club?.settings ?? {}) as Record<string, string>;

  const paceTiersWithUsage = await getPaceTiersWithUsage(membership.club_id);

  return (
    <DashboardShell>
      <PageHeader centered={false} title={content.sections.club} />
      <div className="mt-4 space-y-8">
        <SeasonDatesSection
          clubId={membership.club_id}
          seasonStart={clubSettings.season_start ?? ''}
          seasonEnd={clubSettings.season_end ?? ''}
        />
        <PaceTiersSection clubId={membership.club_id} initialTiers={paceTiersWithUsage} />
      </div>
    </DashboardShell>
  );
}

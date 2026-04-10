import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideForm } from '@/components/rides/ride-form';
import { appContent } from '@/content/app';
import type { IntegrationService } from '@/types/database';
import type { RideFormInitialData } from '@/types/rides';

const { rides: ridesContent } = appContent;

interface RideFormPageProps {
  clubId: string;
  paceGroups: { id: string; name: string }[];
  connectedServices: IntegrationService[];
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  initialData?: RideFormInitialData;
  seasonStart?: string;
  seasonEnd?: string;

  /** Present when editing — triggers edit mode */
  rideId?: string;
  returnTo?: string;

  /** Edit-only: initial co-leader IDs for pre-selection in form */
  initialCoLeaderIds?: string[];
}

export function RideFormPage({
  clubId,
  paceGroups,
  connectedServices,
  eligibleLeaders,
  initialData,
  seasonStart,
  seasonEnd,
  rideId,
  returnTo,
  initialCoLeaderIds,
}: RideFormPageProps) {
  const isEdit = !!rideId;

  return (
    <DashboardShell className="pb-(--bar-clearance)">
      <PageHeader title={isEdit ? ridesContent.edit.heading : ridesContent.create.heading} />

      <RideForm
        clubId={clubId}
        paceGroups={paceGroups}
        rideId={rideId}
        initialData={initialData}
        seasonStart={seasonStart}
        seasonEnd={seasonEnd}
        connectedServices={connectedServices}
        eligibleLeaders={eligibleLeaders}
        initialCoLeaderIds={initialCoLeaderIds}
        returnTo={returnTo}
      />
    </DashboardShell>
  );
}

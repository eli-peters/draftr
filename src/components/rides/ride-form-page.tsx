import Link from 'next/link';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideForm } from '@/components/rides/ride-form';
import { SignupRoster } from '@/components/rides/signup-roster';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { SignupStatus } from '@/config/statuses';
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
  rideTitle?: string;

  /** Edit-only: initial co-leader IDs for pre-selection in form */
  initialCoLeaderIds?: string[];

  /** Edit-only: signups management */
  signups?: {
    id: string;
    status: string;
    signed_up_at: string;
    waitlist_position: number | null;
    user_id: string;
    user_name: string;
    avatar_url: string | null;
  }[];
  rideCreatedBy?: string | null;
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
  rideTitle,
  initialCoLeaderIds,
  signups,
  rideCreatedBy,
}: RideFormPageProps) {
  const isEdit = !!rideId;

  return (
    <DashboardShell>
      <PageHeader
        title={isEdit ? ridesContent.edit.heading : ridesContent.create.heading}
        actions={
          isEdit && rideId ? (
            <Link
              href={`${routes.manageNewRide}?duplicate=${rideId}`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
            >
              <Copy className="size-6" />
            </Link>
          ) : undefined
        }
      />

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
        rideTitle={rideTitle}
        returnTo={returnTo}
        signupCount={
          signups?.filter(
            (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
          ).length
        }
      >
        {isEdit && rideId && signups && (
          <SignupRoster signups={signups} createdBy={rideCreatedBy ?? null} />
        )}
      </RideForm>
    </DashboardShell>
  );
}

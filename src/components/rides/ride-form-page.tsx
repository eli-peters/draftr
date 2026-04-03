import Link from 'next/link';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ui/content-card';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideForm } from '@/components/rides/ride-form';
import { SignupRoster } from '@/components/rides/signup-roster';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
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
  templateId?: string;
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
  templateId,
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
            <Link href={`${routes.manageNewRide}?duplicate=${rideId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
              >
                <Copy className="size-6" />
              </Button>
            </Link>
          ) : undefined
        }
      />

      <RideForm
        clubId={clubId}
        paceGroups={paceGroups}
        rideId={rideId}
        templateId={templateId}
        initialData={initialData}
        seasonStart={seasonStart}
        seasonEnd={seasonEnd}
        connectedServices={connectedServices}
        eligibleLeaders={eligibleLeaders}
        initialCoLeaderIds={initialCoLeaderIds}
        rideTitle={rideTitle}
        returnTo={returnTo}
      >
        {isEdit && rideId && signups && (
          <ContentCard className="mt-8" heading={ridesContent.edit.signups}>
            <SignupRoster signups={signups} createdBy={rideCreatedBy ?? null} />
          </ContentCard>
        )}
      </RideForm>
    </DashboardShell>
  );
}

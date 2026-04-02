import { notFound } from 'next/navigation';
import { Copy, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {
  getRideById,
  getUserSignupStatus,
  getRideSignups,
  getUserClubMembership,
  getRideComments,
  getRideCoLeaders,
} from '@/lib/rides/queries';
import { getRideAvailability } from '@/lib/rides/lifecycle';
import { SignupButton } from '@/components/rides/signup-button';
import { SignupRoster } from '@/components/rides/signup-roster';
import { RideComments } from '@/components/rides/ride-comments';
import { RideDetailCard } from '@/components/rides/ride-detail-card';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ui/content-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { SignupStatus } from '@/config/statuses';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';
import type { Club } from '@/types/database';

const { detail } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup, signups, membership, comments, coLeaders] = await Promise.all([
    getRideById(id),
    getUserSignupStatus(id),
    getRideSignups(id),
    getUserClubMembership(),
    getRideComments(id),
    getRideCoLeaders(id),
  ]);
  if (!ride) notFound();

  const isSignedUp =
    signup?.status === SignupStatus.CONFIRMED || signup?.status === SignupStatus.WAITLISTED;

  const confirmedCount = signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  ).length;
  const waitlistedCount = signups.filter((s) => s.status === SignupStatus.WAITLISTED).length;

  // Centralized availability — replaces manual isPast/isCancelled checks
  const timezone = (membership?.club as unknown as Club)?.timezone ?? 'America/Toronto';
  const availability = getRideAvailability(ride, confirmedCount, timezone);

  const userRole = (membership?.role as UserRole) ?? 'rider';
  const isCreator = membership?.user_id === ride.created_by;
  const isCoLeader = coLeaders.some((cl) => cl.user_id === membership?.user_id);
  const hasEditRole =
    userRole === 'admin' || (userRole === 'ride_leader' && (isCreator || isCoLeader));
  const canEdit = !availability.isPast && !availability.isCancelled && hasEditRole;
  const currentUserId = membership?.user_id ?? null;

  return (
    <DashboardShell>
      {/* Header — title + edit/duplicate actions */}
      <PageHeader
        title={ride.title}
        actions={
          hasEditRole ? (
            <>
              <Link href={`${routes.manageNewRide}?duplicate=${ride.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                >
                  <Copy className="size-6" />
                </Button>
              </Link>
              {canEdit && (
                <Link href={routes.manageEditRide(ride.id, routes.ride(id))}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                  >
                    <PencilSimple className="size-6" />
                  </Button>
                </Link>
              )}
            </>
          ) : undefined
        }
      />

      {/* Main ride detail card — weather integrated near metadata */}
      <RideDetailCard
        ride={ride}
        isSignedUp={isSignedUp}
        signupStatus={signup?.status ?? null}
        waitlistPosition={signup?.waitlist_position ?? null}
        confirmedCount={confirmedCount}
        lifecycle={availability.lifecycle}
        weather={ride.weather}
      />

      {/* Signup CTA — context-aware */}
      {availability.canSignUp && !isSignedUp && (
        <div className="mt-6">
          <SignupButton
            rideId={ride.id}
            isSignedUp={false}
            isCancelled={false}
            isFull={availability.isFull}
          />
        </div>
      )}
      {availability.canCancel && isSignedUp && (
        <div className="mt-6">
          <SignupButton rideId={ride.id} isSignedUp isCancelled={false} />
        </div>
      )}

      {/* Sign-ups closed message — shown when CTA is hidden and rider isn't signed up */}
      {!availability.canSignUp && !availability.isCancelled && !isSignedUp && (
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {appContent.rides.status.signupClosed}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">{detail.signupClosedContact}</p>
        </div>
      )}

      {/* Riders roster */}
      {signups.length > 0 && (
        <div className="mt-8">
          <SectionHeading>
            {detail.ridersHeading(confirmedCount, waitlistedCount, ride.capacity)}
          </SectionHeading>
          <ContentCard padding="compact" className="mt-3">
            <SignupRoster
              signups={signups}
              createdBy={ride.created_by}
              coLeaderIds={coLeaders.map((cl) => cl.user_id)}
            />
          </ContentCard>
        </div>
      )}

      {/* Comments */}
      <div className="mt-8">
        <RideComments
          rideId={ride.id}
          comments={comments}
          currentUserId={currentUserId}
          userRole={userRole}
          isCancelled={availability.isCancelled}
        />
      </div>
    </DashboardShell>
  );
}

import { notFound } from 'next/navigation';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {
  getRideById,
  getUserSignupStatus,
  getRideSignups,
  getUserClubMembership,
  getRideComments,
  getRideCoLeaders,
  getCommentReactions,
} from '@/lib/rides/queries';
import { getRideAvailability } from '@/lib/rides/lifecycle';
import { RideSignupSection } from '@/components/rides/ride-signup-section';
import { RideComments } from '@/components/rides/ride-comments';
import { RideDetailCard } from '@/components/rides/ride-detail-card';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ui/content-card';
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

  const commentReactions = await getCommentReactions(comments.map((c) => c.id));

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
          canEdit ? (
            <Link href={routes.manageEditRide(ride.id, routes.ride(id))}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
              >
                <PencilSimple className="size-6" />
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Main ride detail card */}
      <RideDetailCard
        ride={ride}
        isSignedUp={isSignedUp}
        signupStatus={signup?.status ?? null}
        waitlistPosition={signup?.waitlist_position ?? null}
        lifecycle={availability.lifecycle}
        weather={ride.weather}
      />

      {/* Sign-ups closed message — shown when CTA is hidden and rider isn't signed up */}
      {!availability.canSignUp && !availability.isCancelled && !isSignedUp && (
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {appContent.rides.status.signupClosed}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">{detail.signupClosedContact}</p>
        </div>
      )}

      {/* Riders roster + signup/cancel actions */}
      {signups.length > 0 && (
        <ContentCard
          padding="compact"
          className="mt-8"
          heading={detail.ridersHeading(confirmedCount, waitlistedCount, ride.capacity)}
        >
          <RideSignupSection
            rideId={ride.id}
            signups={signups}
            createdBy={ride.created_by}
            coLeaderIds={coLeaders.map((cl) => cl.user_id)}
            currentUserId={currentUserId}
            isSignedUp={isSignedUp}
            canSignUp={availability.canSignUp}
            canCancel={availability.canCancel}
            isFull={availability.isFull}
          />
        </ContentCard>
      )}

      {/* Floating signup bar for when roster is empty but signup is available */}
      {signups.length === 0 && availability.canSignUp && !isSignedUp && (
        <RideSignupSection
          rideId={ride.id}
          signups={[]}
          currentUserId={currentUserId}
          isSignedUp={false}
          canSignUp
          canCancel={false}
          isFull={availability.isFull}
        />
      )}

      {/* Comments */}
      <div className="mt-8">
        <RideComments
          rideId={ride.id}
          comments={comments}
          commentReactions={commentReactions}
          currentUserId={currentUserId}
          userRole={userRole}
          isCancelled={availability.isCancelled}
        />
      </div>

      {/* Bottom spacer when floating signup bar is visible — prevents content from hiding behind it */}
      {/* revisit CTA placement after context testing */}
      {availability.canSignUp && !isSignedUp && <div className="h-24 md:h-20" />}
    </DashboardShell>
  );
}

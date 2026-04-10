import { notFound } from 'next/navigation';
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
import { RideSignupActionBar } from '@/components/rides/ride-signup-action-bar';
import { RideComments } from '@/components/rides/ride-comments';
import { RideDetailCard } from '@/components/rides/ride-detail-card';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideKebabMenu } from '@/components/rides/ride-kebab-menu';

import { Users } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import { SignupStatus } from '@/config/statuses';
import { computeRideActionState } from '@/lib/rides/action-bar-state';

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

  const confirmedSignups = signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  );
  const waitlistedCount = signups.filter((s) => s.status === SignupStatus.WAITLISTED).length;

  // Leaders don't count against capacity
  const leaderUserIds = new Set([ride.created_by, ...coLeaders.map((cl) => cl.user_id)]);
  const riderConfirmedCount = confirmedSignups.filter((s) => !leaderUserIds.has(s.user_id)).length;

  // Centralized availability — uses non-leader count for capacity math
  const timezone = (membership?.club as unknown as Club)?.timezone ?? 'America/Toronto';
  const availability = getRideAvailability(ride, riderConfirmedCount, timezone);

  // Avatar data for action bar — first 4 confirmed signups
  const actionBarAvatars = confirmedSignups.slice(0, 4).map((s) => ({
    avatar_url: s.avatar_url,
    full_name: s.user_name,
  }));

  const activeSignupCount = signups.filter((s) => s.status !== 'cancelled').length;
  const userRole = (membership?.role as UserRole) ?? 'rider';
  const isCreator = membership?.user_id === ride.created_by;
  const isCoLeader = coLeaders.some((cl) => cl.user_id === membership?.user_id);
  const hasEditRole =
    userRole === 'admin' || (userRole === 'ride_leader' && (isCreator || isCoLeader));
  const currentUserId = membership?.user_id ?? null;

  const actionBarState = computeRideActionState({
    isSignedUp: signup?.status === SignupStatus.CONFIRMED,
    isOnWaitlist: signup?.status === SignupStatus.WAITLISTED,
    waitlistPosition: signup?.waitlist_position ?? null,
    isFull: availability.isFull,
    isCancelled: availability.isCancelled,
    isPast: availability.isPast,
    canSignUp: availability.canSignUp,
    canCancel: availability.canCancel,
    confirmedCount: riderConfirmedCount,
    capacity: ride.capacity,
    isSoleLeader: isCreator && coLeaders.length === 0,
  });

  const showManageActions = hasEditRole && !availability.isCancelled;

  return (
    <DashboardShell>
      <PageHeader
        title={ride.title}
        centered={!showManageActions}
        actions={
          showManageActions ? (
            <RideKebabMenu
              rideId={ride.id}
              canCancel={availability.canCancel}
              signupCount={activeSignupCount}
            />
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
          icon={Users}
          heading={`${detail.spotsCount(riderConfirmedCount, ride.capacity)}${waitlistedCount > 0 ? ` · ${detail.waitlistedCount(waitlistedCount)}` : ''}`}
        >
          <RideSignupSection
            rideId={ride.id}
            signups={signups}
            createdBy={ride.created_by}
            coLeaderIds={coLeaders.map((cl) => cl.user_id)}
            currentUserId={currentUserId}
            canRemoveRiders={userRole === 'admin'}
          />
        </ContentCard>
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

      {/* Spacer — fixed on mobile (overlaps content, needs full clearance); sticky on desktop (in flow, small gap). */}
      {!availability.isCancelled && <div className="h-(--bar-clearance) md:h-8" />}

      {/* Signup action bar — pinned to viewport bottom on both breakpoints. */}
      {!availability.isCancelled && (
        <RideSignupActionBar
          rideId={ride.id}
          state={actionBarState}
          avatars={actionBarAvatars}
          totalCount={confirmedSignups.length}
          signupCount={activeSignupCount}
        />
      )}
    </DashboardShell>
  );
}

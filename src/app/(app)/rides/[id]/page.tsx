import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ContentTransition } from '@/components/motion/content-transition';
import {
  getRideById,
  getUserSignupStatus,
  getRideSignups,
  getUserClubMembership,
  getRideCoLeaders,
} from '@/lib/rides/queries';
import { getRideAvailability } from '@/lib/rides/lifecycle';
import { RideSignupSection } from '@/components/rides/ride-signup-section';
import { RideSignupActionBar } from '@/components/rides/ride-signup-action-bar';
import { RideDetailCard, RideDetailCardBody } from '@/components/rides/ride-detail-card';
import { MapBackdropSheet } from '@/components/rides/map-backdrop-sheet';
import { RouteMapBackdropLoader } from '@/components/rides/route-map-backdrop-loader';
import { RideDetailResponsive } from '@/components/rides/ride-detail-responsive';
import { RideDetailScrollReset } from '@/components/rides/ride-detail-scroll-reset';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideKebabMenu } from '@/components/rides/ride-kebab-menu';
import { RideCommentsSection } from './_components/ride-comments-section';
import { CommentsSkeleton } from './_components/comments-skeleton';

import { Users } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import { SignupStatus } from '@/config/statuses';
import { computeRideActionState } from '@/lib/rides/action-bar-state';

import type { ReactNode } from 'react';
import type { UserRole } from '@/config/navigation';
import type { Club } from '@/types/database';

const { detail } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup, signups, membership, coLeaders] = await Promise.all([
    getRideById(id),
    getUserSignupStatus(id),
    getRideSignups(id),
    getUserClubMembership(),
    getRideCoLeaders(id),
  ]);
  if (!ride) notFound();

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
  const club = membership?.club as Club | null;
  const timezone = club?.timezone ?? 'America/Toronto';
  const availability = getRideAvailability(ride, riderConfirmedCount, timezone);

  // Avatar data for action bar — first 4 confirmed signups
  const actionBarAvatars = confirmedSignups.slice(0, 4).map((s) => ({
    avatar_url: s.avatar_url,
    full_name: s.user_name,
  }));

  const activeSignupCount = signups.filter((s) => s.status !== 'cancelled').length;
  const role = membership?.role;
  const userRole: UserRole = role === 'admin' || role === 'ride_leader' ? role : 'rider';
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
  const showSignupClosed = !availability.canSignUp && !availability.isCancelled && !isSignedUp;
  const showRoster = signups.length > 0;
  const rosterHeading = `${detail.spotsCount(riderConfirmedCount, ride.capacity)}${waitlistedCount > 0 ? ` · ${detail.waitlistedCount(waitlistedCount)}` : ''}`;

  const header = (
    <PageHeader
      title={ride.title}
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
  );

  const signupClosedBlock: ReactNode = showSignupClosed ? (
    <div className="mt-card-stack">
      <p className="text-sm font-medium text-muted-foreground">
        {appContent.rides.status.signupClosed}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail.signupClosedContact}</p>
    </div>
  ) : null;

  const rosterBlock: ReactNode = showRoster ? (
    <ContentCard padding="compact" className="mt-card-stack" icon={Users} heading={rosterHeading}>
      <RideSignupSection
        rideId={ride.id}
        signups={signups}
        createdBy={ride.created_by}
        coLeaderIds={coLeaders.map((cl) => cl.user_id)}
        currentUserId={currentUserId}
        canRemoveRiders={userRole === 'admin'}
      />
    </ContentCard>
  ) : null;

  const commentsBlock = (
    <div className="mt-card-stack">
      <Suspense fallback={<CommentsSkeleton />}>
        <ContentTransition>
          <RideCommentsSection
            rideId={ride.id}
            currentUserId={currentUserId}
            userRole={userRole}
            isCancelled={availability.isCancelled}
          />
        </ContentTransition>
      </Suspense>
    </div>
  );

  const mobileTree = (
    <MapBackdropSheet
      backdrop={
        <RouteMapBackdropLoader polylineStr={ride.route_polyline} routeUrl={ride.route_url} />
      }
    >
      <div className="px-5 pt-6 pb-(--bar-clearance)">
        {header}
        <RideDetailCardBody ride={ride} weather={ride.weather} includeRouteMap={false} />
        {signupClosedBlock}
        {rosterBlock}
        {commentsBlock}
      </div>
    </MapBackdropSheet>
  );

  const desktopTree = (
    <DashboardShell className={!availability.isCancelled ? 'pb-(--bar-clearance)' : undefined}>
      {header}
      <RideDetailCard
        ride={ride}
        isSignedUp={isSignedUp}
        signupStatus={signup?.status ?? null}
        waitlistPosition={signup?.waitlist_position ?? null}
        lifecycle={availability.lifecycle}
        weather={ride.weather}
      />
      {signupClosedBlock}
      {rosterBlock}
      {commentsBlock}
    </DashboardShell>
  );

  return (
    <>
      <RideDetailScrollReset rideId={ride.id} />
      <RideDetailResponsive mobile={mobileTree} desktop={desktopTree} />

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
    </>
  );
}

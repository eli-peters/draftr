import { notFound } from 'next/navigation';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {
  getRideById,
  getUserSignupStatus,
  getRideSignups,
  getUserClubMembership,
  getRideComments,
  getRidePickups,
} from '@/lib/rides/queries';
import { getRideAvailability } from '@/lib/rides/lifecycle';
import { SignupButton } from '@/components/rides/signup-button';
import { SignupRoster } from '@/components/rides/signup-roster';
import { RideComments } from '@/components/rides/ride-comments';
import { RidePickups } from '@/components/rides/ride-pickups';
import { RideDetailCard } from '@/components/rides/ride-detail-card';
import { RideWeatherSummary } from '@/components/weather/ride-weather-summary';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { SignupStatus } from '@/config/statuses';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { detail } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup, signups, membership, comments, pickups] = await Promise.all([
    getRideById(id),
    getUserSignupStatus(id),
    getRideSignups(id),
    getUserClubMembership(),
    getRideComments(id),
    getRidePickups(id),
  ]);
  if (!ride) notFound();

  const isSignedUp =
    signup?.status === SignupStatus.CONFIRMED || signup?.status === SignupStatus.WAITLISTED;

  const confirmedCount = signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  ).length;
  const waitlistedCount = signups.filter((s) => s.status === SignupStatus.WAITLISTED).length;

  // Centralized availability — replaces manual isPast/isCancelled checks
  const availability = getRideAvailability(ride, confirmedCount);

  const userRole = (membership?.role as UserRole) ?? 'rider';
  const isCreator = membership?.user_id === ride.created_by;
  const hasEditRole = userRole === 'admin' || (userRole === 'ride_leader' && isCreator);
  const canEdit = !availability.isPast && !availability.isCancelled && hasEditRole;
  const currentUserId = membership?.user_id ?? null;

  return (
    <DashboardShell>
      {/* Header — title + edit/duplicate actions */}
      <PageHeader
        title={ride.title}
        actions={
          canEdit || (hasEditRole && (availability.isCancelled || availability.isPast)) ? (
            <>
              {canEdit && (
                <Link href={routes.manageEditRide(ride.id)}>
                  <Button variant="outline" size="sm">
                    {appContent.rides.edit.heading}
                  </Button>
                </Link>
              )}
              {hasEditRole && (availability.isCancelled || availability.isPast) && (
                <Link href={`${routes.manageNewRide}?duplicate=${ride.id}`}>
                  <Button variant="outline" size="sm">
                    <Copy className="mr-1.5 h-4 w-4" />
                    {detail.duplicateAsNew}
                  </Button>
                </Link>
              )}
            </>
          ) : undefined
        }
      />

      {/* Weather summary */}
      <RideWeatherSummary weather={ride.weather} />

      {/* Main ride detail card */}
      <RideDetailCard
        ride={ride}
        isSignedUp={isSignedUp}
        signupStatus={signup?.status ?? null}
        waitlistPosition={signup?.waitlist_position ?? null}
        confirmedCount={confirmedCount}
        lifecycle={availability.lifecycle}
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
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <SignupRoster signups={signups} createdBy={ride.created_by} />
          </div>
        </div>
      )}

      {/* Pickup points */}
      {pickups.length > 0 && (
        <div className="mt-8">
          <RidePickups pickups={pickups} />
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

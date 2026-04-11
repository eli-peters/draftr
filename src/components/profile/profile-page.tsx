'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { ActionBar } from '@/components/ui/action-bar';
import { ProfileIdentityHero } from '@/components/profile/profile-identity-hero';
import { ProfileStatsBento } from '@/components/profile/profile-stats-bento';
import { ProfileRecentRides } from '@/components/profile/profile-recent-rides';
import { ProfileContactCard } from '@/components/profile/profile-contact-card';
import { ProfileEmergencyCard } from '@/components/profile/profile-emergency-card';
import {
  ProfileFormContext,
  type ProfileFormContextValue,
  type ProfileFormFields,
} from '@/hooks/use-profile-form-state';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { updateProfile } from '@/lib/profile/actions';
import { stripToDigits, toE164 } from '@/lib/phone';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';
import type { RecentRide } from '@/lib/profile/queries';

const { profile: content, common } = appContent;

interface ProfilePageProps {
  subject: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: 'rider' | 'ride_leader' | 'admin';
    memberSince: string;
    totalRides: number;
    ridesThisMonth: number;
    bio: string;
    preferredPaceGroup: string;
    phoneNumber: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
  };
  access: ProfileViewerAccess;
  paceGroups: { id: string; name: string; sort_order: number }[];
  recentRides: RecentRide[];
}

/**
 * Shared profile page shell consumed by both /profile (own) and /profile/[userId]
 * (public) routes. Mode and visibility are driven entirely by `access`:
 *   - access.canEdit        → shows the Edit affordance + floating save bar
 *   - access.canSeeContact  → renders the contact sidebar card
 *   - access.canSeeEmail    → reveals email inside the contact card
 *   - access.canSeeEmergency → renders the emergency contact card
 *
 * Layout:
 *   With sidebar (self / admin / leader view): two-column grid.
 *     Left (300px): Contact + Emergency cards stacked.
 *     Right (fluid): Stats bento (3 tiles) above Recent Rides.
 *   Without sidebar (member-to-member view): single-column bento.
 *     Stats bento (3 tiles, full width) above Recent Rides (full width).
 */
export function ProfilePage({ subject, access, paceGroups, recentRides }: ProfilePageProps) {
  const initialValues: ProfileFormFields = useMemo(
    () => ({
      bio: subject.bio,
      preferred_pace_group: subject.preferredPaceGroup,
      // Phone fields are stored as raw 10-digit strings while editing;
      // they are normalized to E.164 on save.
      phone_number: stripToDigits(subject.phoneNumber).slice(-10),
      emergency_contact_name: subject.emergencyContactName,
      emergency_contact_phone: stripToDigits(subject.emergencyContactPhone).slice(-10),
      emergency_contact_relationship: subject.emergencyContactRelationship,
    }),
    [subject],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<ProfileFormFields>(initialValues);
  const [isPending, startTransition] = useTransition();

  const cancelEdit = useCallback(() => {
    setValues(initialValues);
    setIsEditing(false);
  }, [initialValues]);

  useEscapeKey(isEditing && !isPending, cancelEdit);

  const beginEdit = useCallback(() => {
    setValues(initialValues);
    setIsEditing(true);
  }, [initialValues]);

  const setField = useCallback<ProfileFormContextValue['setField']>((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      // Validate phone numbers before dispatch — the server action will also
      // validate, but failing fast keeps the UX tight.
      if (values.phone_number && !toE164(values.phone_number)) {
        toast.error(content.emergencyContact.phoneInvalidError);
        return;
      }
      if (values.emergency_contact_phone && !toE164(values.emergency_contact_phone)) {
        toast.error(content.emergencyContact.phoneInvalidError);
        return;
      }

      const result = await updateProfile({
        bio: values.bio,
        preferred_pace_group: values.preferred_pace_group,
        phone_number: values.phone_number,
        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_phone: values.emergency_contact_phone,
        emergency_contact_relationship: values.emergency_contact_relationship,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.saved);
      setIsEditing(false);
    });
  }, [values]);

  const formContextValue: ProfileFormContextValue = useMemo(
    () => ({ isEditing, isPending, values, setField, beginEdit, cancelEdit }),
    [isEditing, isPending, values, setField, beginEdit, cancelEdit],
  );

  const showSidebar = access.canSeeContact || access.canSeeEmergency;

  const statsBento = (
    <ProfileStatsBento totalRides={subject.totalRides} ridesThisMonth={subject.ridesThisMonth} />
  );

  return (
    <ProfileFormContext.Provider value={formContextValue}>
      <DashboardShell className={isEditing ? 'pb-(--bar-clearance)' : undefined}>
        <ProfileIdentityHero
          fullName={subject.fullName}
          avatarUrl={subject.avatarUrl}
          memberSince={subject.memberSince}
          initialBio={subject.bio}
          initialPace={subject.preferredPaceGroup}
          paceGroups={paceGroups}
          access={access}
        />

        {showSidebar ? (
          // Two-column layout: left sidebar (contact/emergency) + right primary column
          // (stats bento → recent rides). Stats live in the right column so all content
          // in that column shares one width, fixing the prior grid misalignment.
          <div className="mt-card-stack grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-card-stack">
              {access.canSeeContact && (
                <ProfileContactCard
                  email={subject.email}
                  initialPhone={subject.phoneNumber}
                  access={access}
                />
              )}
              {access.canSeeEmergency && (
                <ProfileEmergencyCard
                  initialName={subject.emergencyContactName}
                  initialPhone={subject.emergencyContactPhone}
                  initialRelationship={subject.emergencyContactRelationship}
                />
              )}
            </aside>
            <div className="flex flex-col gap-card-stack">
              {statsBento}
              <ProfileRecentRides rides={recentRides} />
            </div>
          </div>
        ) : (
          // Member-to-member bento view: no sidebar, stats expand to full width in a
          // 3-column grid, recent rides fills full width below.
          <div className="mt-card-stack flex flex-col gap-card-stack">
            {statsBento}
            <ProfileRecentRides rides={recentRides} />
          </div>
        )}

        {isEditing && (
          <ActionBar
            left={
              <Button variant="muted" size="sm" onClick={cancelEdit} disabled={isPending}>
                {common.cancel}
              </Button>
            }
            right={
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? common.loading : content.saveChanges}
              </Button>
            }
          />
        )}
      </DashboardShell>
    </ProfileFormContext.Provider>
  );
}

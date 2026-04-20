'use client';

import { useCallback, useMemo, useState, useTransition, type ReactNode } from 'react';

import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { ActionBar } from '@/components/ui/action-bar';
import { ProfileIdentityHero } from '@/components/profile/profile-identity-hero';

import { ProfileContactCard } from '@/components/profile/profile-contact-card';
import { ProfileEmergencyCard } from '@/components/profile/profile-emergency-card';
import { ProfilePersonalInfoCard } from '@/components/profile/profile-personal-info-card';
import { ProfileMembershipCard } from '@/components/profile/profile-membership-card';
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

const { profile: content, common } = appContent;

interface ProfilePageProps {
  subject: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: 'rider' | 'ride_leader' | 'admin';
    memberSince: string;
    bio: string;
    preferredPaceGroup: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
  };
  access: ProfileViewerAccess;
  paceGroups: { id: string; name: string; sort_order: number }[];
  memberships: import('@/lib/profile/queries').UserMembership[];
  statsSlot: ReactNode;
  recentRidesSlot: ReactNode;
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
export function ProfilePage({
  subject,
  access,
  memberships,
  statsSlot,
  recentRidesSlot,
}: ProfilePageProps) {
  const initialValues: ProfileFormFields = useMemo(
    () => ({
      first_name: subject.firstName,
      last_name: subject.lastName,
      bio: subject.bio,
      preferred_pace_group: subject.preferredPaceGroup,
      // Phone fields are stored as raw 10-digit strings while editing;
      // they are normalized to E.164 on save.
      phone_number: stripToDigits(subject.phoneNumber).slice(-10),
      date_of_birth: subject.dateOfBirth,
      gender: subject.gender,
      street_address_line_1: subject.streetAddress1,
      street_address_line_2: subject.streetAddress2,
      city: subject.city,
      province: subject.province,
      postal_code: subject.postalCode,
      country: subject.country,
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
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        preferred_pace_group: values.preferred_pace_group,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        street_address_line_1: values.street_address_line_1,
        street_address_line_2: values.street_address_line_2,
        city: values.city,
        province: values.province,
        postal_code: values.postal_code,
        country: values.country,
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

  // Personal info (DOB, gender, address, phone, email): self + admin only.
  // canSeeEmail is true for exactly self + admin in the access model.
  const canSeePersonalInfo = access.canSeeEmail;
  const showSidebar = canSeePersonalInfo || access.canSeeContact || access.canSeeEmergency;

  const statsBento = statsSlot;

  return (
    <ProfileFormContext.Provider value={formContextValue}>
      <DashboardShell className={isEditing ? 'pb-(--bar-clearance)' : undefined}>
        <ProfileIdentityHero
          fullName={subject.fullName}
          avatarUrl={subject.avatarUrl}
          memberSince={subject.memberSince}
          initialBio={subject.bio}
          access={access}
        />

        {showSidebar ? (
          <div className="mt-card-stack flex flex-col gap-card-stack lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-card-stack">
            {/* Stats — mobile order 1 / desktop col 2 row 1 */}
            <div className="order-1 lg:order-0 lg:col-start-2">{statsBento}</div>

            {/* Personal Info or Contact — mobile order 2 / desktop col 1 row 1 */}
            {canSeePersonalInfo && (
              <div className="order-2 lg:order-0 lg:col-start-1">
                <ProfilePersonalInfoCard
                  email={subject.email}
                  initialPhone={subject.phoneNumber}
                  initialDateOfBirth={subject.dateOfBirth}
                  initialGender={subject.gender}
                  initialStreetAddress1={subject.streetAddress1}
                  initialStreetAddress2={subject.streetAddress2}
                  initialCity={subject.city}
                  initialProvince={subject.province}
                  initialPostalCode={subject.postalCode}
                  initialCountry={subject.country}
                />
              </div>
            )}
            {!canSeePersonalInfo && access.canSeeContact && (
              <div className="order-2 lg:order-0 lg:col-start-1">
                <ProfileContactCard
                  email={subject.email}
                  initialPhone={subject.phoneNumber}
                  access={access}
                />
              </div>
            )}

            {/* Emergency Contact — mobile order 3 / desktop col 1 row 2 */}
            {access.canSeeEmergency && (
              <div className="order-3 lg:order-0 lg:col-start-1">
                <ProfileEmergencyCard
                  initialName={subject.emergencyContactName}
                  initialPhone={subject.emergencyContactPhone}
                  initialRelationship={subject.emergencyContactRelationship}
                />
              </div>
            )}

            {/* Membership — mobile order 4 / desktop col 2 row 2 */}
            {canSeePersonalInfo && (
              <div className="order-4 lg:order-0 lg:col-start-2">
                <ProfileMembershipCard memberships={memberships} />
              </div>
            )}

            {/* Recent Rides — mobile order 5 / desktop col 2 row 3 */}
            <div className="order-5 lg:order-0 lg:col-start-2">{recentRidesSlot}</div>
          </div>
        ) : (
          <div className="mt-card-stack flex flex-col gap-card-stack">
            {statsBento}
            {recentRidesSlot}
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

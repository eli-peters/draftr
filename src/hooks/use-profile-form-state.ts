'use client';

import { createContext, useContext } from 'react';

/**
 * Editable fields on the profile page. Avatar is excluded on purpose — it
 * commits immediately on file selection via a separate server action, not
 * through the whole-page edit flow.
 */
export interface ProfileFormFields {
  first_name: string;
  last_name: string;
  bio: string;
  preferred_pace_group: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  street_address_line_1: string;
  street_address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

export interface ProfileFormContextValue {
  /** Is the whole page currently in edit mode? */
  isEditing: boolean;
  /** Is a save in flight? */
  isPending: boolean;
  /** Current working values — what the user has typed. */
  values: ProfileFormFields;
  /** Update a single field. No-op when not editing. */
  setField: <K extends keyof ProfileFormFields>(key: K, value: ProfileFormFields[K]) => void;
  /** Enter edit mode. */
  beginEdit: () => void;
  /** Revert all fields to the last-saved values and exit edit mode. */
  cancelEdit: () => void;
}

export const ProfileFormContext = createContext<ProfileFormContextValue | null>(null);

export function useProfileForm(): ProfileFormContextValue {
  const ctx = useContext(ProfileFormContext);
  if (!ctx) {
    throw new Error('useProfileForm must be used inside <ProfilePageProvider>');
  }
  return ctx;
}

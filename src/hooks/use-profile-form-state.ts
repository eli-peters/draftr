'use client';

import { createContext, useContext } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ProfileValues } from '@/lib/forms/schemas';

/**
 * Editable fields on the profile page. Mirrors the database columns so values
 * flow directly to the updateProfile server action. Avatar is excluded — it
 * commits immediately on file selection via a separate flow.
 */
export type ProfileFormFields = ProfileValues;

/**
 * Context exposed to all profile cards. Wraps a single shared RHF instance
 * (provided by `<ProfilePageProvider>`) plus the page-level edit-mode toggle
 * that all cards observe in lockstep.
 */
export interface ProfileFormContextValue {
  /** Is the whole page currently in edit mode? */
  isEditing: boolean;
  /** Is a save in flight? */
  isPending: boolean;
  /** Enter edit mode. Resets RHF values to the last-saved subject snapshot. */
  beginEdit: () => void;
  /** Revert all fields to the last-saved values and exit edit mode. */
  cancelEdit: () => void;
  /** Underlying react-hook-form instance — use `form.control` with `<FormField>`. */
  form: UseFormReturn<ProfileFormFields>;
}

export const ProfileFormContext = createContext<ProfileFormContextValue | null>(null);

export function useProfileForm(): ProfileFormContextValue {
  const ctx = useContext(ProfileFormContext);
  if (!ctx) {
    throw new Error('useProfileForm must be used inside <ProfilePageProvider>');
  }
  return ctx;
}

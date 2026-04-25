import { z } from 'zod';

import { appContent } from '@/content/app';

import { firstNameField, lastNameField, phoneOptionalField, phoneRequiredField } from './shared';

const v = appContent.validation;

const BIO_MAX = 500;

/**
 * Combined schema for the entire profile-edit form (identity hero + personal
 * info + contact + emergency cards all share one RHF instance).
 * Field names mirror the database columns so values can flow directly to
 * the updateProfile server action.
 */
export const profileSchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  bio: z.string().max(BIO_MAX, v.profile.bioTooLong).optional().or(z.literal('')),
  preferred_pace_group: z.string().optional().or(z.literal('')),
  phone_number: phoneOptionalField,
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  street_address_line_1: z.string().optional().or(z.literal('')),
  street_address_line_2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  emergency_contact_name: z.string().optional().or(z.literal('')),
  emergency_contact_phone: phoneOptionalField,
  emergency_contact_relationship: z.string().optional().or(z.literal('')),
});

export type ProfileValues = z.infer<typeof profileSchema>;

/** Identity card — name + dob + gender + bio. */
export const profileIdentitySchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  bio: z.string().max(BIO_MAX, v.profile.bioTooLong).optional().or(z.literal('')),
});

/** Contact card — phone + address. All optional. */
export const profileContactSchema = z.object({
  phone_number: phoneOptionalField,
  street_address_line_1: z.string().optional().or(z.literal('')),
  street_address_line_2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
});

/** Emergency contact card — required name/phone/relationship. */
export const profileEmergencySchema = z.object({
  emergency_contact_name: z
    .string({ error: v.profile.emergencyNameRequired })
    .trim()
    .min(1, v.profile.emergencyNameRequired),
  emergency_contact_phone: phoneRequiredField,
  emergency_contact_relationship: z
    .string({ error: v.profile.emergencyRelationshipRequired })
    .trim()
    .min(1, v.profile.emergencyRelationshipRequired),
});

/** Riding preferences card — pace group only (free-form). */
export const profilePreferencesSchema = z.object({
  preferred_pace_group: z.string().optional().or(z.literal('')),
});

export type ProfileIdentityValues = z.infer<typeof profileIdentitySchema>;
export type ProfileContactValues = z.infer<typeof profileContactSchema>;
export type ProfileEmergencyValues = z.infer<typeof profileEmergencySchema>;
export type ProfilePreferencesValues = z.infer<typeof profilePreferencesSchema>;

export const PROFILE_BIO_MAX_LENGTH = BIO_MAX;

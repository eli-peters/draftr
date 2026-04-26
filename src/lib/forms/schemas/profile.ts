import { z } from 'zod';

import { appContent } from '@/content/app';

import { inputLimits } from '../limits';
import { firstNameField, lastNameField, phoneOptionalField, phoneRequiredField } from './shared';

const v = appContent.validation;

const optionalText = (max: number) =>
  z.string().max(max, v.generic.tooLong(max)).optional().or(z.literal(''));

/**
 * Combined schema for the entire profile-edit form (identity hero + personal
 * info + contact + emergency cards all share one RHF instance).
 * Field names mirror the database columns so values can flow directly to
 * the updateProfile server action.
 */
export const profileSchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  bio: z.string().max(inputLimits.profile.bio, v.profile.bioTooLong).optional().or(z.literal('')),
  preferred_pace_group: optionalText(inputLimits.profile.paceGroupPref),
  phone_number: phoneOptionalField,
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  street_address_line_1: optionalText(inputLimits.address.line),
  street_address_line_2: optionalText(inputLimits.address.line),
  city: optionalText(inputLimits.address.city),
  province: optionalText(inputLimits.address.region),
  postal_code: optionalText(inputLimits.address.postalCode),
  country: optionalText(inputLimits.address.country),
  emergency_contact_name: optionalText(inputLimits.profile.emergencyContactName),
  emergency_contact_phone: phoneOptionalField,
  emergency_contact_relationship: optionalText(inputLimits.profile.emergencyContactRelationship),
});

export type ProfileValues = z.infer<typeof profileSchema>;

/** Identity card — name + dob + gender + bio. */
export const profileIdentitySchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  bio: z.string().max(inputLimits.profile.bio, v.profile.bioTooLong).optional().or(z.literal('')),
});

/** Contact card — phone + address. All optional. */
export const profileContactSchema = z.object({
  phone_number: phoneOptionalField,
  street_address_line_1: optionalText(inputLimits.address.line),
  street_address_line_2: optionalText(inputLimits.address.line),
  city: optionalText(inputLimits.address.city),
  province: optionalText(inputLimits.address.region),
  postal_code: optionalText(inputLimits.address.postalCode),
  country: optionalText(inputLimits.address.country),
});

/** Emergency contact card — required name/phone/relationship. */
export const profileEmergencySchema = z.object({
  emergency_contact_name: z
    .string({ error: v.profile.emergencyNameRequired })
    .trim()
    .min(1, v.profile.emergencyNameRequired)
    .max(
      inputLimits.profile.emergencyContactName,
      v.generic.tooLong(inputLimits.profile.emergencyContactName),
    ),
  emergency_contact_phone: phoneRequiredField,
  emergency_contact_relationship: z
    .string({ error: v.profile.emergencyRelationshipRequired })
    .trim()
    .min(1, v.profile.emergencyRelationshipRequired)
    .max(
      inputLimits.profile.emergencyContactRelationship,
      v.generic.tooLong(inputLimits.profile.emergencyContactRelationship),
    ),
});

/** Riding preferences card — pace group only (free-form). */
export const profilePreferencesSchema = z.object({
  preferred_pace_group: optionalText(inputLimits.profile.paceGroupPref),
});

export type ProfileIdentityValues = z.infer<typeof profileIdentitySchema>;
export type ProfileContactValues = z.infer<typeof profileContactSchema>;
export type ProfileEmergencyValues = z.infer<typeof profileEmergencySchema>;
export type ProfilePreferencesValues = z.infer<typeof profilePreferencesSchema>;

export const PROFILE_BIO_MAX_LENGTH = inputLimits.profile.bio;

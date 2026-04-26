import { z } from 'zod';

import { appContent } from '@/content/app';

import { inputLimits } from '../limits';
import { passwordNewField } from './shared';

const v = appContent.validation;

/**
 * Schema for the post-invite profile setup form.
 * Mirrors the fields the server action reads from FormData:
 *   - password (sets the new account's password)
 *   - full_name (split into first/last on the server; require ≥2 tokens here)
 *   - bio (optional)
 */
export const setupProfileSchema = z.object({
  password: passwordNewField,
  full_name: z
    .string({ error: v.name.fullNameInvalid })
    .trim()
    .min(1, v.name.fullNameInvalid)
    .max(inputLimits.profile.fullName, v.name.tooLong)
    .regex(/\S+\s+\S+/, v.name.fullNameInvalid),
  bio: z.string().max(inputLimits.profile.bio, v.profile.bioTooLong).optional().or(z.literal('')),
});

export type SetupProfileValues = z.infer<typeof setupProfileSchema>;

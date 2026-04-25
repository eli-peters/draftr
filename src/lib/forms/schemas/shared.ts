import { z } from 'zod';

import { appContent } from '@/content/app';

const v = appContent.validation;

/** Email — required + RFC-ish format check. */
export const emailField = z
  .string({ error: v.email.required })
  .min(1, v.email.required)
  .email(v.email.invalid);

/** Password — current (sign-in). Requires non-empty only; format checks happen on the new-password path. */
export const passwordCurrentField = z
  .string({ error: v.password.required })
  .min(1, v.password.required);

/** Password — new account / reset. Enforces minimum length. */
export const passwordNewField = z
  .string({ error: v.password.required })
  .min(8, v.password.tooShort);

/** Phone — optional but, if present, must look phoneish (digits, spaces, dashes, parens, +). */
export const phoneOptionalField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^[+()\-\s\d]{7,}$/.test(value), { message: v.phone.invalid });

/** Phone — required, with the same format check. */
export const phoneRequiredField = z
  .string({ error: v.phone.invalid })
  .trim()
  .min(1, v.phone.invalid)
  .regex(/^[+()\-\s\d]{7,}$/, v.phone.invalid);

/** First name. */
export const firstNameField = z
  .string({ error: v.name.firstRequired })
  .trim()
  .min(1, v.name.firstRequired)
  .max(60, v.name.tooLong);

/** Last name. */
export const lastNameField = z
  .string({ error: v.name.lastRequired })
  .trim()
  .min(1, v.name.lastRequired)
  .max(60, v.name.tooLong);

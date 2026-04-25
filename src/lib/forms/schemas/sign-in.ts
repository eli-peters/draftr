import { z } from 'zod';

import { emailField, passwordCurrentField } from './shared';

export const signInSchema = z.object({
  email: emailField,
  password: passwordCurrentField,
});

export type SignInValues = z.infer<typeof signInSchema>;

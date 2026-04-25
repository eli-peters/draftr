import { z } from 'zod';

import { appContent } from '@/content/app';

const v = appContent.validation;

export const waitlistSchema = z.object({
  email: z
    .string({ error: v.waitlist.emailRequired })
    .min(1, v.waitlist.emailRequired)
    .email(v.email.invalid),
});

export type WaitlistValues = z.infer<typeof waitlistSchema>;

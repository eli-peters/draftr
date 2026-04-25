import { z } from 'zod';

import { appContent } from '@/content/app';

import { emailField } from './shared';

const v = appContent.validation;

export const inviteMemberSchema = z.object({
  email: emailField,
  role: z.enum(['rider', 'ride_leader', 'admin'], {
    error: v.invite.roleRequired,
  }),
});

export type InviteMemberValues = z.infer<typeof inviteMemberSchema>;

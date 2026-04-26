import { z } from 'zod';

import { appContent } from '@/content/app';

import { inputLimits } from '../limits';

const v = appContent.validation;

export const announcementTypeEnum = z.enum(['general', 'event', 'urgent']);
export type AnnouncementTypeValue = z.infer<typeof announcementTypeEnum>;

export const announcementSchema = z.object({
  title: z
    .string({ error: v.announcement.titleRequired })
    .trim()
    .min(1, v.announcement.titleRequired)
    .max(inputLimits.announcement.title, v.announcement.titleTooLong),
  body: z
    .string({ error: v.announcement.bodyRequired })
    .trim()
    .min(1, v.announcement.bodyRequired)
    .max(inputLimits.announcement.body, v.announcement.bodyTooLong),
  announcement_type: announcementTypeEnum,
  is_dismissible: z.boolean(),
  is_pinned: z.boolean(),
});

export type AnnouncementValues = z.infer<typeof announcementSchema>;
export const ANNOUNCEMENT_TITLE_MAX = inputLimits.announcement.title;
export const ANNOUNCEMENT_BODY_MAX = inputLimits.announcement.body;

import { z } from 'zod';

import { appContent } from '@/content/app';

const v = appContent.validation;

const TITLE_MAX = 120;
const BODY_MAX = 500;

export const announcementTypeEnum = z.enum(['general', 'event', 'urgent']);
export type AnnouncementTypeValue = z.infer<typeof announcementTypeEnum>;

export const announcementSchema = z.object({
  title: z
    .string({ error: v.announcement.titleRequired })
    .trim()
    .min(1, v.announcement.titleRequired)
    .max(TITLE_MAX, v.announcement.titleTooLong),
  body: z
    .string({ error: v.announcement.bodyRequired })
    .trim()
    .min(1, v.announcement.bodyRequired)
    .max(BODY_MAX, v.announcement.bodyTooLong),
  announcement_type: announcementTypeEnum,
  is_dismissible: z.boolean(),
  is_pinned: z.boolean(),
});

export type AnnouncementValues = z.infer<typeof announcementSchema>;
export const ANNOUNCEMENT_TITLE_MAX = TITLE_MAX;
export const ANNOUNCEMENT_BODY_MAX = BODY_MAX;

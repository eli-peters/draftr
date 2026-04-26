import { z } from 'zod';

import { appContent } from '@/content/app';

import { inputLimits } from '../limits';

const v = appContent.validation;

/** Body of a ride comment. Required, capped at the comment limit. */
export const commentBodySchema = z
  .string({ error: v.comment.bodyRequired })
  .trim()
  .min(1, v.comment.bodyRequired)
  .max(inputLimits.comment.body, v.comment.bodyTooLong);

export const COMMENT_BODY_MAX_LENGTH = inputLimits.comment.body;

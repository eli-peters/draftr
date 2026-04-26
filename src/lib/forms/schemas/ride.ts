import { z } from 'zod';

import { appContent } from '@/content/app';

import { inputLimits } from '../limits';

const v = appContent.validation;

/** Strava and Ride With GPS route URLs are the only accepted services. */
const ROUTE_URL_PATTERN = /^https?:\/\/(www\.)?(strava\.com|ridewithgps\.com)\//i;

export const rideSchema = z.object({
  // Route — required
  routeUrl: z
    .string({ error: v.ride.routeRequired })
    .min(1, v.ride.routeRequired)
    .regex(ROUTE_URL_PATTERN, v.ride.routeInvalid),

  // Details
  title: z
    .string({ error: v.ride.titleRequired })
    .trim()
    .min(1, v.ride.titleRequired)
    .max(inputLimits.ride.title, v.ride.titleTooLong),
  description: z.string().max(inputLimits.ride.description, v.ride.descriptionTooLong).optional(),
  distanceKm: z.string().optional(),
  elevationM: z.string().optional(),
  capacity: z
    .string({ error: v.ride.capacityInvalid })
    .min(1, v.ride.capacityInvalid)
    .refine((value) => Number(value) >= 1, { message: v.ride.capacityInvalid }),
  paceGroupId: z.string({ error: v.ride.paceRequired }).min(1, v.ride.paceRequired),
  isDropRide: z.boolean().optional(),

  // When & where
  rideDate: z.string({ error: v.ride.dateRequired }).min(1, v.ride.dateRequired),
  startTime: z.string({ error: v.ride.timeRequired }).min(1, v.ride.timeRequired),
  startLocationName: z.string().optional(),
  startLocationAddress: z.string().optional(),
  startLatitude: z.number().nullable().optional(),
  startLongitude: z.number().nullable().optional(),

  // Riders
  selectedCoLeaders: z.array(z.string()),

  // Internal route metadata captured during import — not user-editable.
  routeName: z.string(),
  routePolyline: z.string(),
});

export type RideValues = z.infer<typeof rideSchema>;
export const RIDE_TITLE_MAX_LENGTH = inputLimits.ride.title;
export const RIDE_DESCRIPTION_MAX_LENGTH = inputLimits.ride.description;

/** Standalone schema for the cancellation-reason textarea on cancel-ride-button. */
export const cancellationReasonSchema = z
  .string()
  .max(inputLimits.ride.cancellationReason, v.ride.cancellationReasonTooLong)
  .optional()
  .or(z.literal(''));
export const RIDE_CANCELLATION_REASON_MAX_LENGTH = inputLimits.ride.cancellationReason;

import { z } from 'zod';

import { appContent } from '@/content/app';

const v = appContent.validation;

const RIDE_TITLE_MAX = 80;
const RIDE_DESCRIPTION_MAX = 1000;

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
    .max(RIDE_TITLE_MAX, v.ride.titleTooLong),
  description: z.string().max(RIDE_DESCRIPTION_MAX, v.ride.descriptionTooLong).optional(),
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
export const RIDE_TITLE_MAX_LENGTH = RIDE_TITLE_MAX;
export const RIDE_DESCRIPTION_MAX_LENGTH = RIDE_DESCRIPTION_MAX;

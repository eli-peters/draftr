import { updateTag } from 'next/cache';

// ---------------------------------------------------------------------------
// Cache tag taxonomy — centralised constants for unstable_cache + updateTag
// ---------------------------------------------------------------------------

/** Global ride feed (upcoming rides list) */
export const TAG_RIDES = 'rides';

/** Individual ride detail */
export function tagRide(rideId: string) {
  return `ride:${rideId}`;
}

/** Signups for a specific ride */
export function tagRideSignups(rideId: string) {
  return `ride-signups:${rideId}`;
}

/** User's personal ride data (my-rides, next-signup, waitlisted) */
export function tagUserRides(userId: string) {
  return `user-rides:${userId}`;
}

/** User profile */
export function tagProfile(userId: string) {
  return `profile:${userId}`;
}

/** Club membership / role */
export function tagMembership(userId: string) {
  return `membership:${userId}`;
}

/** Notification list for a user */
export function tagNotifications(userId: string) {
  return `notifications:${userId}`;
}

/** Pinned announcements for a club */
export function tagAnnouncements(clubId: string) {
  return `announcements:${clubId}`;
}

/** Admin management data (members, templates) */
export function tagManage(clubId: string) {
  return `manage:${clubId}`;
}

/** Ride weather snapshots */
export function tagWeather(rideId: string) {
  return `weather:${rideId}`;
}

/** Pace group definitions for a club */
export function tagPaceGroups(clubId: string) {
  return `pace-groups:${clubId}`;
}

// ---------------------------------------------------------------------------
// Invalidation helpers — call these from server actions
// updateTag guarantees read-your-own-writes and notifies the client to re-render
// ---------------------------------------------------------------------------

function purgeTag(tag: string) {
  updateTag(tag);
}

/** Invalidate ride-related caches after a signup/cancel action */
export function invalidateRideSignup(rideId: string, userId: string) {
  purgeTag(tagRide(rideId));
  purgeTag(tagRideSignups(rideId));
  purgeTag(tagUserRides(userId));
  purgeTag(TAG_RIDES);
}

/** Invalidate after ride create/edit/delete */
export function invalidateRideMutation(rideId: string, clubId?: string) {
  purgeTag(tagRide(rideId));
  purgeTag(TAG_RIDES);
  if (clubId) purgeTag(tagManage(clubId));
}

/** Invalidate after comment/reaction on a ride */
export function invalidateRideDetail(rideId: string) {
  purgeTag(tagRide(rideId));
}

/** Invalidate after member management action */
export function invalidateManage(clubId: string, userId?: string) {
  purgeTag(tagManage(clubId));
  if (userId) purgeTag(tagMembership(userId));
}

/** Invalidate after announcement change */
export function invalidateAnnouncements(clubId: string) {
  purgeTag(tagAnnouncements(clubId));
}

/** Invalidate after pace group / template change */
export function invalidatePaceGroups(clubId: string) {
  purgeTag(tagPaceGroups(clubId));
  purgeTag(tagManage(clubId));
}

/** Invalidate user profile cache */
export function invalidateProfile(userId: string) {
  purgeTag(tagProfile(userId));
}

/** Invalidate user notification cache */
export function invalidateNotifications(userId: string) {
  purgeTag(tagNotifications(userId));
}

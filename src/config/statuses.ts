export const RideStatus = {
  CANCELLED: 'cancelled',
  WEATHER_WATCH: 'weather_watch',
} as const;

export const SignupStatus = {
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  CHECKED_IN: 'checked_in',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MemberStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type RideStatus = (typeof RideStatus)[keyof typeof RideStatus];
export type SignupStatus = (typeof SignupStatus)[keyof typeof SignupStatus];
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

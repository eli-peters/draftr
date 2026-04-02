/**
 * TypeScript types mirroring the Supabase database schema.
 * Keep in sync with supabase/migrations/*.sql.
 *
 * These are the "row" types — what comes back from queries.
 * For insert/update types, use Partial<> or Pick<> as needed.
 */

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferred_pace_group: string | null;
  notification_preferences: {
    push: boolean;
    email: boolean;
    quiet_start: string;
    quiet_end: string;
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'rider' | 'ride_leader' | 'admin';
export type MemberStatus = 'active' | 'inactive' | 'pending';

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  oca_registered: boolean;
  waiver_signed_at: string | null;
  joined_at: string;
}

export interface MeetingLocation {
  id: string;
  club_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaceGroup {
  id: string;
  club_id: string;
  name: string;
  moving_pace_min: number | null;
  moving_pace_max: number | null;
  strava_pace_min: number | null;
  strava_pace_max: number | null;
  typical_distance_min: number | null;
  typical_distance_max: number | null;
  is_drop_ride: boolean;
  sort_order: number;
  created_at: string;
}

export type RideStatus = 'scheduled' | 'weather_watch' | 'cancelled' | 'completed';

export interface Ride {
  id: string;
  club_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  meeting_location_id: string | null;
  pace_group_id: string | null;
  distance_km: number | null;
  elevation_m: number | null;
  capacity: number | null;
  route_url: string;
  route_name: string | null;
  route_polyline: string | null;
  is_drop_ride: boolean;
  status: RideStatus;
  cancellation_reason: string | null;
  weather_watch_auto: boolean;
  template_id: string | null;
  start_location_name: string | null;
  start_location_address: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser {
  id: string;
  ride_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  avatar_url: string | null;
}

export type SignupStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'checked_in';

export interface RideSignup {
  id: string;
  ride_id: string;
  user_id: string;
  status: SignupStatus;
  waitlist_position: number | null;
  signed_up_at: string;
  checked_in_at: string | null;
  cancelled_at: string | null;
}

export type ReactionType = 'thumbs_up' | 'fire' | 'heart' | 'laugh' | 'cycling';

export interface RideReaction {
  id: string;
  ride_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

export interface ReactionSummary {
  reaction: ReactionType;
  count: number;
  userNames: string[];
  hasReacted: boolean;
}

export interface RideComment {
  id: string;
  ride_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export type AnnouncementType = 'info' | 'warning' | 'danger' | 'success';

export interface Announcement {
  id: string;
  club_id: string;
  created_by: string | null;
  title: string;
  body: string;
  is_pinned: boolean;
  pinned_to_ride_id: string | null;
  published_at: string;
  expires_at: string | null;
  announcement_type: AnnouncementType;
  is_dismissible: boolean;
  max_duration_days: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  ride_id: string | null;
  is_read: boolean;
  channel: 'push' | 'email' | 'both';
  sent_at: string;
}

export interface RideTemplate {
  id: string;
  club_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  day_of_week: number | null;
  start_time: string;
  meeting_location_id: string | null;
  pace_group_id: string | null;
  default_distance_km: number | null;
  default_capacity: number | null;
  default_route_url: string | null;
  default_route_name: string | null;
  default_route_polyline: string | null;
  is_drop_ride: boolean;
  is_active: boolean;
  recurrence: 'weekly' | 'biweekly' | 'monthly' | null;
  season_start_date: string | null;
  season_end_date: string | null;
  last_generated_date: string | null;
  generate_weeks_ahead: number;
  end_after_occurrences: number | null;
  end_date: string | null;
  default_start_location_name: string | null;
  default_start_location_address: string | null;
  default_start_latitude: number | null;
  default_start_longitude: number | null;
  created_at: string;
}

export interface WeatherRule {
  id: string;
  club_id: string;
  name: string;
  rain_probability_threshold: number | null;
  wind_speed_threshold: number | null;
  humidex_max: number | null;
  aqhi_threshold: number | null;
  is_default: boolean;
  created_at: string;
}

export interface RideWeatherSnapshot {
  id: string;
  ride_id: string;
  fetched_at: string;
  temperature_c: number | null;
  feels_like_c: number | null;
  humidity: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  pop: number | null;
  precipitation_mm: number | null;
  weather_code: number | null;
  weather_main: string | null;
  weather_icon: string | null;
  is_day: boolean | null;
  source: string;
}

export type IntegrationService = 'strava' | 'ridewithgps';

export interface UserConnection {
  id: string;
  user_id: string;
  service: IntegrationService;
  external_user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  scope: string;
  profile_data: Record<string, unknown> | null;
  connected_at: string;
  updated_at: string;
}

/**
 * Normalized route from Strava or RideWithGPS, ready for import into a ride.
 */
export interface ImportableRoute {
  id: string; // "{service}:{originalId}"
  service: IntegrationService;
  name: string;
  description: string | null;
  distance_m: number;
  elevation_m: number;
  source_url: string;
  source_type: 'route' | 'activity';
  polyline: string | null;
  start_latitude?: number | null;
  start_longitude?: number | null;
  created_at: string;
}

/**
 * Ride with joined relations — common query shape for the feed and detail pages.
 */
/** Minimal user info for signup avatar display. */
export interface SignupAvatar {
  avatar_url: string | null;
  full_name: string;
}

export interface RideWithDetails extends Ride {
  meeting_location: MeetingLocation | null;
  pace_group: PaceGroup | null;
  signup_count: number;
  /** First few confirmed signups for avatar display (ordered by signed_up_at). */
  signup_avatars: SignupAvatar[];
  creator: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
  co_leaders: { user_id: string; full_name: string; avatar_url: string | null }[];
  current_user_signup_status: 'confirmed' | 'waitlisted' | null;
  current_user_waitlist_position: number | null;
  weather: RideWeatherSnapshot | null;
}

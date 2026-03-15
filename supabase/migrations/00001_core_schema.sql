-- ============================================================================
-- Draftr Core Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ============================================================================
-- 1. Core Tables
-- ============================================================================

-- Clubs (multi-club ready from day one)
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  timezone TEXT DEFAULT 'America/Toronto',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_pace_group TEXT,
  notification_preferences JSONB DEFAULT '{"push": true, "email": true, "quiet_start": "22:00", "quiet_end": "07:00"}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Club memberships (many-to-many with roles)
CREATE TABLE club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('rider', 'ride_leader', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  oca_registered BOOLEAN DEFAULT false,
  waiver_signed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- ============================================================================
-- 2. Location & Pace Group Reference Tables
-- ============================================================================

-- Reusable meeting locations
CREATE TABLE meeting_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pace groups with speed/distance ranges
CREATE TABLE pace_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  moving_pace_min DECIMAL(4,1),
  moving_pace_max DECIMAL(4,1),
  strava_pace_min DECIMAL(4,1),
  strava_pace_max DECIMAL(4,1),
  typical_distance_min INTEGER,
  typical_distance_max INTEGER,
  is_drop_ride BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. Rides (The Core)
-- ============================================================================

-- Recurring ride templates
CREATE TABLE ride_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER,
  start_time TIME NOT NULL,
  meeting_location_id UUID REFERENCES meeting_locations(id),
  pace_group_id UUID REFERENCES pace_groups(id),
  default_distance_km DECIMAL(6,1),
  default_capacity INTEGER,
  default_route_url TEXT,
  default_route_name TEXT,
  is_drop_ride BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  recurrence TEXT CHECK (recurrence IN ('weekly', 'biweekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rides
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  ride_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  meeting_location_id UUID REFERENCES meeting_locations(id),
  pace_group_id UUID REFERENCES pace_groups(id),
  distance_km DECIMAL(6,1),
  elevation_m INTEGER,
  capacity INTEGER,
  route_url TEXT,
  route_name TEXT,
  is_drop_ride BOOLEAN DEFAULT false,
  organiser_notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'weather_watch', 'cancelled', 'completed')),
  cancellation_reason TEXT,
  template_id UUID REFERENCES ride_templates(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rolling pickups for rides with multiple start locations
CREATE TABLE ride_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  location_id UUID REFERENCES meeting_locations(id),
  pickup_time TIME NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================================
-- 4. Tags & Signups
-- ============================================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(club_id, name)
);

CREATE TABLE ride_tags (
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ride_id, tag_id)
);

-- Ride signups (heart of one-tap sign-up)
CREATE TABLE ride_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'waitlisted', 'cancelled', 'checked_in')),
  waitlist_position INTEGER,
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  checked_in_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  UNIQUE(ride_id, user_id)
);

-- ============================================================================
-- 5. Engagement (Post-Ride)
-- ============================================================================

CREATE TABLE ride_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL
    CHECK (reaction IN ('thumbs_up', 'fire', 'suffering', 'heart', 'wind')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, user_id, reaction)
);

CREATE TABLE ride_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ride_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. Announcements & Notifications
-- ============================================================================

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  pinned_to_ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  channel TEXT NOT NULL DEFAULT 'push'
    CHECK (channel IN ('push', 'email', 'both')),
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. Weather Rules
-- ============================================================================

CREATE TABLE weather_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rain_probability_threshold INTEGER,
  wind_speed_threshold INTEGER,
  humidex_max DECIMAL(4,1),
  aqhi_threshold INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. Performance Indexes
-- ============================================================================

CREATE INDEX idx_rides_club_date ON rides(club_id, ride_date);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_ride_signups_ride ON ride_signups(ride_id);
CREATE INDEX idx_ride_signups_user ON ride_signups(user_id);
CREATE INDEX idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_announcements_club ON announcements(club_id, is_pinned);
CREATE INDEX idx_meeting_locations_club ON meeting_locations(club_id);
CREATE INDEX idx_pace_groups_club ON pace_groups(club_id);
CREATE INDEX idx_tags_club ON tags(club_id);

-- ============================================================================
-- Row Level Security Policies
-- Run this AFTER 00001 and 00002
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pace_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_rules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: get user's role in a club
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_club_role(p_club_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM club_memberships
  WHERE club_id = p_club_id AND user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user is a member of a club
CREATE OR REPLACE FUNCTION is_club_member(p_club_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id AND user_id = p_user_id AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user is admin of a club
CREATE OR REPLACE FUNCTION is_club_admin(p_club_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id AND user_id = p_user_id AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user is ride leader or admin
CREATE OR REPLACE FUNCTION is_club_leader_or_admin(p_club_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id AND user_id = p_user_id AND role IN ('ride_leader', 'admin') AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- Clubs: members can read their clubs
-- ============================================================================

CREATE POLICY "Members can view their clubs"
  ON clubs FOR SELECT
  USING (is_club_member(id, auth.uid()));

-- ============================================================================
-- Users: members can read profiles, users can update own
-- ============================================================================

CREATE POLICY "Authenticated users can view profiles"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- Club Memberships: admins manage, members read
-- ============================================================================

CREATE POLICY "Members can view club memberships"
  ON club_memberships FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can manage memberships"
  ON club_memberships FOR INSERT
  WITH CHECK (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can update memberships"
  ON club_memberships FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can delete memberships"
  ON club_memberships FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Meeting Locations & Pace Groups: members read, leaders/admins write
-- ============================================================================

CREATE POLICY "Members can view meeting locations"
  ON meeting_locations FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Leaders can manage meeting locations"
  ON meeting_locations FOR ALL
  USING (is_club_leader_or_admin(club_id, auth.uid()));

CREATE POLICY "Members can view pace groups"
  ON pace_groups FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can manage pace groups"
  ON pace_groups FOR ALL
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Rides: members read, leaders/admins create and manage
-- ============================================================================

CREATE POLICY "Members can view rides"
  ON rides FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Leaders can create rides"
  ON rides FOR INSERT
  WITH CHECK (is_club_leader_or_admin(club_id, auth.uid()));

CREATE POLICY "Leaders can update their rides"
  ON rides FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_club_admin(club_id, auth.uid())
  );

CREATE POLICY "Admins can delete rides"
  ON rides FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Ride Pickups: same as rides
-- ============================================================================

CREATE POLICY "Members can view ride pickups"
  ON ride_pickups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_pickups.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Leaders can manage ride pickups"
  ON ride_pickups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_pickups.ride_id
      AND is_club_leader_or_admin(r.club_id, auth.uid())
    )
  );

-- ============================================================================
-- Tags: members read, admins manage
-- ============================================================================

CREATE POLICY "Members can view tags"
  ON tags FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can manage tags"
  ON tags FOR ALL
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Ride Tags: members read, leaders manage
-- ============================================================================

CREATE POLICY "Members can view ride tags"
  ON ride_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_tags.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Leaders can manage ride tags"
  ON ride_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_tags.ride_id
      AND is_club_leader_or_admin(r.club_id, auth.uid())
    )
  );

-- ============================================================================
-- Ride Signups: members manage own, can view all for their club's rides
-- ============================================================================

CREATE POLICY "Members can view ride signups"
  ON ride_signups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can sign up for rides"
  ON ride_signups FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can update own signup"
  ON ride_signups FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- Engagement: members manage own, read all
-- ============================================================================

CREATE POLICY "Members can view reactions"
  ON ride_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_reactions.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can add reactions"
  ON ride_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can remove own reactions"
  ON ride_reactions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Members can view comments"
  ON ride_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_comments.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can add comments"
  ON ride_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can edit own comments"
  ON ride_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Members can delete own comments"
  ON ride_comments FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Members can view photos"
  ON ride_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_photos.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can upload photos"
  ON ride_photos FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================================
-- Announcements: members read, admins manage
-- ============================================================================

CREATE POLICY "Members can view announcements"
  ON announcements FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Notifications: users can only see/manage their own
-- ============================================================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- Weather Rules: members read, admins manage
-- ============================================================================

CREATE POLICY "Members can view weather rules"
  ON weather_rules FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Admins can manage weather rules"
  ON weather_rules FOR ALL
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- Ride Templates: members read, leaders manage
-- ============================================================================

CREATE POLICY "Members can view ride templates"
  ON ride_templates FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

CREATE POLICY "Leaders can manage ride templates"
  ON ride_templates FOR ALL
  USING (is_club_leader_or_admin(club_id, auth.uid()));

-- ============================================================================
-- Ride Leaders — co-leader support for rides
-- ============================================================================
-- Allows multiple leaders per ride. The ride creator (rides.created_by) is
-- always the primary leader. This table tracks additional co-leaders.
-- ============================================================================

CREATE TABLE ride_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, user_id)
);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE ride_leaders ENABLE ROW LEVEL SECURITY;

-- Club members can see who is leading a ride
CREATE POLICY "Members can view ride leaders"
  ON ride_leaders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_leaders.ride_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

-- Ride creator or admin can add co-leaders
CREATE POLICY "Ride creator or admin can add co-leaders"
  ON ride_leaders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_leaders.ride_id
      AND (
        r.created_by = auth.uid()
        OR is_club_admin(r.club_id, auth.uid())
      )
    )
  );

-- Ride creator or admin can remove co-leaders
CREATE POLICY "Ride creator or admin can remove co-leaders"
  ON ride_leaders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_leaders.ride_id
      AND (
        r.created_by = auth.uid()
        OR is_club_admin(r.club_id, auth.uid())
      )
    )
  );

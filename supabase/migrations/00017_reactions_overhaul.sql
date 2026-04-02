-- ============================================================================
-- Migration 00017: Reactions overhaul
--
-- 1. Create ride_reactions table (was defined in 00001 schema but never applied)
-- 2. Create comment_reactions table for per-comment reactions
-- 3. RLS policies for both tables
--
-- Reaction set: thumbs_up, fire, heart, laugh, cycling
-- ============================================================================

-- 1. Create ride_reactions table
CREATE TABLE ride_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL
    CHECK (reaction IN ('thumbs_up', 'fire', 'heart', 'laugh', 'cycling')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, user_id, reaction)
);

ALTER TABLE ride_reactions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Members remove own reactions or admin override"
  ON ride_reactions FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      JOIN club_memberships cm ON cm.club_id = r.club_id AND cm.user_id = auth.uid()
      WHERE r.id = ride_reactions.ride_id
      AND cm.role = 'admin'
    )
  );

-- 2. Create comment_reactions table
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES ride_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL
    CHECK (reaction IN ('thumbs_up', 'fire', 'heart', 'laugh', 'cycling')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comment reactions"
  ON comment_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ride_comments rc
      JOIN rides r ON r.id = rc.ride_id
      WHERE rc.id = comment_reactions.comment_id
      AND is_club_member(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members can add comment reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members remove own comment reactions or admin override"
  ON comment_reactions FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ride_comments rc
      JOIN rides r ON r.id = rc.ride_id
      JOIN club_memberships cm ON cm.club_id = r.club_id AND cm.user_id = auth.uid()
      WHERE rc.id = comment_reactions.comment_id
      AND cm.role = 'admin'
    )
  );

-- ============================================================================
-- RLS Policy Alignment with RBAC Permission Matrix
-- Fixes gaps between the Notion spec and the implemented policies
-- Run this AFTER 00003_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- 1. USERS: Add admin override for updating other users' profiles
-- Spec: Admin CRUD all (club)
-- Was missing: Admin UPDATE for other users in their club
-- ============================================================================

-- Drop and recreate UPDATE policy to include admin override
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile or admin can update club members"
  ON users FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm1
      JOIN club_memberships cm2 ON cm1.club_id = cm2.club_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.role = 'admin'
        AND cm1.status = 'active'
        AND cm2.user_id = users.id
        AND cm2.status = 'active'
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm1
      JOIN club_memberships cm2 ON cm1.club_id = cm2.club_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.role = 'admin'
        AND cm1.status = 'active'
        AND cm2.user_id = users.id
        AND cm2.status = 'active'
    )
  );

-- ============================================================================
-- 2. RIDE SIGNUPS: Leader walk-ups, leader check-in, admin override, DELETE
-- Spec: Admin CRUD all | Leader: R led, C led (walk-ups), U led (check-in) | Rider: R all, CUD own
-- Was missing: Leader INSERT for walk-ups, leader UPDATE for check-in,
--              admin override on all ops, DELETE policy entirely
-- ============================================================================

-- Drop existing INSERT and UPDATE policies
DROP POLICY IF EXISTS "Members can sign up for rides" ON ride_signups;
DROP POLICY IF EXISTS "Members can update own signup" ON ride_signups;

-- INSERT: self sign-up OR leader adds walk-up to rides they lead OR admin
CREATE POLICY "Members can sign up or leaders can add walk-ups"
  ON ride_signups FOR INSERT
  WITH CHECK (
    -- Rider signs up for themselves
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM rides r
        WHERE r.id = ride_signups.ride_id
        AND is_club_member(r.club_id, auth.uid())
      )
    )
    OR
    -- Leader adds walk-up to a ride they lead
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND r.created_by = auth.uid()
    )
    OR
    -- Admin can add anyone
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

-- UPDATE: self (cancel) OR leader on rides they lead (check-in) OR admin
CREATE POLICY "Members update own or leaders check-in or admin override"
  ON ride_signups FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND r.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

-- DELETE: rider deletes own OR admin deletes any
-- Note: Leaders CANNOT remove signed-up riders (per spec — escalate to admin)
CREATE POLICY "Riders delete own signup or admin override"
  ON ride_signups FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_signups.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

-- ============================================================================
-- 3. RIDE TEMPLATES: Restrict SELECT, fix leader permissions
-- Spec: Admin CRUD all | Leader: CR all, U own | Rider: None
-- Was wrong: Riders could read. Leaders could delete any.
-- ============================================================================

DROP POLICY IF EXISTS "Members can view ride templates" ON ride_templates;
DROP POLICY IF EXISTS "Leaders can manage ride templates" ON ride_templates;

-- SELECT: leaders and admins only (riders have no access)
CREATE POLICY "Leaders and admins can view ride templates"
  ON ride_templates FOR SELECT
  USING (is_club_leader_or_admin(club_id, auth.uid()));

-- INSERT: leaders and admins can create
CREATE POLICY "Leaders and admins can create ride templates"
  ON ride_templates FOR INSERT
  WITH CHECK (is_club_leader_or_admin(club_id, auth.uid()));

-- UPDATE: leaders update own, admins update any
CREATE POLICY "Leaders update own templates or admin override"
  ON ride_templates FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_club_admin(club_id, auth.uid())
  );

-- DELETE: admin only
CREATE POLICY "Admins can delete ride templates"
  ON ride_templates FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- 4. MEETING LOCATIONS: Fix to admin-only write
-- Spec: Admin CRUD | Leader/Rider: R only
-- Was wrong: Leaders had full write access
-- ============================================================================

DROP POLICY IF EXISTS "Leaders can manage meeting locations" ON meeting_locations;

CREATE POLICY "Admins can manage meeting locations"
  ON meeting_locations FOR ALL
  USING (is_club_admin(club_id, auth.uid()));

-- ============================================================================
-- 5. RIDE PHOTOS: Add DELETE policy
-- Spec: Members delete own, admins delete any
-- Was missing: No DELETE policy at all
-- ============================================================================

CREATE POLICY "Members can delete own photos or admin override"
  ON ride_photos FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_photos.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

-- ============================================================================
-- 6. NOTIFICATIONS: Add INSERT policy, admin read-all
-- Spec: Admin R all (club) + C all (send) | Leader: R own, C for ride updates | Rider: R own
-- Was missing: No INSERT policy. Admin restricted to own notifications only.
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

-- SELECT: own notifications OR admin can see all for their club's members
CREATE POLICY "Users view own or admin views all club notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm_admin
      JOIN club_memberships cm_target ON cm_admin.club_id = cm_target.club_id
      WHERE cm_admin.user_id = auth.uid()
        AND cm_admin.role = 'admin'
        AND cm_admin.status = 'active'
        AND cm_target.user_id = notifications.user_id
        AND cm_target.status = 'active'
    )
  );

-- INSERT: admins can send to anyone in their club, leaders can send for rides they lead
CREATE POLICY "Admins and leaders can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    -- Admin can send to any club member
    EXISTS (
      SELECT 1 FROM club_memberships cm_admin
      JOIN club_memberships cm_target ON cm_admin.club_id = cm_target.club_id
      WHERE cm_admin.user_id = auth.uid()
        AND cm_admin.role = 'admin'
        AND cm_admin.status = 'active'
        AND cm_target.user_id = notifications.user_id
        AND cm_target.status = 'active'
    )
    OR
    -- Leader can send notifications for rides they lead
    (
      notifications.ride_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM rides r
        WHERE r.id = notifications.ride_id
        AND r.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- 7. COMMENTS: Add admin moderation override
-- Spec: Admin CRUD all (club)
-- Was missing: Admin couldn't delete/edit other users' comments
-- ============================================================================

DROP POLICY IF EXISTS "Members can edit own comments" ON ride_comments;
DROP POLICY IF EXISTS "Members can delete own comments" ON ride_comments;

CREATE POLICY "Members edit own comments or admin override"
  ON ride_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_comments.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

CREATE POLICY "Members delete own comments or admin override"
  ON ride_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_comments.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

-- ============================================================================
-- 8. REACTIONS: Add admin moderation override
-- Spec: Admin CRUD all (club)
-- Was missing: Admin couldn't remove other users' reactions
-- ============================================================================

DROP POLICY IF EXISTS "Members can remove own reactions" ON ride_reactions;

CREATE POLICY "Members remove own reactions or admin override"
  ON ride_reactions FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_reactions.ride_id
      AND is_club_admin(r.club_id, auth.uid())
    )
  );

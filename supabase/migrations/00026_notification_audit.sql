-- ============================================================================
-- 00026: Notification audit — priority tier + dedup index
--
-- Adds a priority column so urgent notifications (cancellations, removals,
-- weather watch, leader promotion) can drive badge colour and future sort
-- order differently from informational ones (signup confirmations).
--
-- Adds a partial index over (user_id, type, ride_id) WHERE is_read = false
-- to accelerate action-reversal lookups — when a rider cancels a signup we
-- delete the stale unread notifications for that (type, ride) tuple.
-- ============================================================================

ALTER TABLE notifications
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'normal', 'low'));

CREATE INDEX idx_notifications_reversal
  ON notifications(user_id, type, ride_id)
  WHERE is_read = false;

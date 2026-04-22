-- ============================================================
-- OFSMS Migration 008 — Notifications & Announcements
-- Depends on: 001_create_users.sql (users table)
-- ============================================================
-- ── Notification type enum ────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'registration_approved',
  'registration_rejected',
  'quran_report_reminder',
  'disbursement_reminder',
  'disbursement_approved',
  'disbursement_rejected',
  'general'
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_id UUID,
  -- optional: orphan_id, report_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(recipient_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ── Announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published_at DESC);

CREATE TRIGGER trg_announcements_updated_at BEFORE
UPDATE
  ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('notifications', 'announcements');
-- Expected: 2 rows
-- ============================================================
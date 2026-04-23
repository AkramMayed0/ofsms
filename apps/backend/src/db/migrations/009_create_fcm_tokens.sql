-- ============================================================
-- OFSMS Migration 009 — FCM Device Tokens
-- Depends on: 001_create_users.sql (users table)
--
-- Stores Firebase Cloud Messaging tokens per user.
-- One user can have multiple tokens (multiple browsers/devices).
-- Tokens are upserted on each login/session start.
-- ============================================================

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- The FCM registration token from the browser/device
  token       TEXT         NOT NULL UNIQUE,
  -- User-agent string for debugging (which browser/device)
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens(user_id);

CREATE TRIGGER trg_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'fcm_tokens';
-- Expected: id, user_id, token, user_agent, created_at, updated_at
-- ============================================================

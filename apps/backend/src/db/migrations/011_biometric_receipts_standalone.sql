-- ============================================================
-- OFSMS Migration 011 — Biometric Receipts (standalone)
-- Depends on: 007_create_disbursements.sql (biometric_receipts
--             table already created there)
--
-- This migration ensures all required columns and indexes exist
-- on the biometric_receipts table per SADD §7.1.
-- Idempotent — safe to run even if table already exists.
-- ============================================================

-- Ensure the table exists (it was created in 007, but this
-- makes this migration self-sufficient for fresh environments
-- that skip disbursements and go straight to this file).
CREATE TABLE IF NOT EXISTS biometric_receipts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The disbursement item this receipt confirms
  item_id          UUID        NOT NULL UNIQUE
                               REFERENCES disbursement_items(id) ON DELETE CASCADE,

  -- The agent who physically handed over the money and captured the print
  agent_id         UUID        NOT NULL
                               REFERENCES users(id) ON DELETE RESTRICT,

  -- S3 key for the fingerprint image (e.g. "biometrics/<uuid>.png")
  -- Use s3.getSignedUrl(fingerprint_key) at read time — never store signed URLs
  fingerprint_key  TEXT        NOT NULL,

  confirmed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (all use IF NOT EXISTS — safe to re-run)
CREATE INDEX IF NOT EXISTS idx_biometric_receipts_agent
  ON biometric_receipts(agent_id);

CREATE INDEX IF NOT EXISTS idx_biometric_receipts_item
  ON biometric_receipts(item_id);

-- ============================================================
-- Verify with:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'biometric_receipts'
--   ORDER BY ordinal_position;
--
-- Expected columns: id, item_id, agent_id, fingerprint_key,
--                   confirmed_at
-- ============================================================
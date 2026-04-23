-- ============================================================
-- OFSMS Migration 007 — Gifted Orphan Config
-- Depends on: 002_families_orphans_documents.sql (orphans table)
-- Covers: FR-056, FR-057, FR-058, FR-059
--
-- Stores the per-orphan benefits bundle for gifted orphans.
-- All benefit fields are optional — GM configures what applies.
-- ============================================================

CREATE TABLE IF NOT EXISTS gifted_configs (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One config record per orphan (1:1 with gifted orphans)
  orphan_id           UUID          NOT NULL UNIQUE
                        REFERENCES orphans(id) ON DELETE CASCADE,

  -- Monthly cash top-up (on top of the base sponsorship amount)
  extra_monthly_amount NUMERIC(10, 2) NOT NULL DEFAULT 0
                        CHECK (extra_monthly_amount >= 0),

  -- School enrollment commitment
  school_name         VARCHAR(200),
  school_enrolled     BOOLEAN       NOT NULL DEFAULT FALSE,

  -- In-kind benefits (TRUE = included in this orphan's package)
  uniform_included    BOOLEAN       NOT NULL DEFAULT FALSE,
  bag_included        BOOLEAN       NOT NULL DEFAULT FALSE,
  transport_included  BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Monthly personal allowance (pocket money)
  personal_allowance  NUMERIC(10, 2) NOT NULL DEFAULT 0
                        CHECK (personal_allowance >= 0),

  -- Free-text notes for anything not covered by the columns above
  notes               TEXT,

  -- Audit
  created_by          UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gifted_configs_orphan ON gifted_configs(orphan_id);

CREATE TRIGGER trg_gifted_configs_updated_at
  BEFORE UPDATE ON gifted_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'gifted_configs' ORDER BY ordinal_position;
-- Expected columns: id, orphan_id, extra_monthly_amount,
--   school_name, school_enrolled, uniform_included, bag_included,
--   transport_included, personal_allowance, notes,
--   created_by, created_at, updated_at
-- ============================================================

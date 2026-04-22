-- ============================================================
-- OFSMS Migration 005 — Quran Reports
-- Depends on: 002_families_orphans_documents.sql (orphans table)
--             001_create_users.sql (users table)
-- ============================================================
CREATE TABLE IF NOT EXISTS quran_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The orphan this report is for
  orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
  -- The agent who submitted the report
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Reporting period
  month SMALLINT NOT NULL CHECK (
    month BETWEEN 1
    AND 12
  ),
  year SMALLINT NOT NULL CHECK (year >= 2020),
  -- Memorization progress (e.g. 2.5 = 2.5 juz, 0.5 = half a juz)
  juz_memorized NUMERIC(4, 2) NOT NULL CHECK (juz_memorized >= 0),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Supervisor review
  status quran_report_status NOT NULL DEFAULT 'pending',
  supervisor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One report per orphan per month/year
  UNIQUE (orphan_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_quran_reports_orphan ON quran_reports(orphan_id);

CREATE INDEX IF NOT EXISTS idx_quran_reports_agent ON quran_reports(agent_id);

CREATE INDEX IF NOT EXISTS idx_quran_reports_period ON quran_reports(year, month);

CREATE INDEX IF NOT EXISTS idx_quran_reports_status ON quran_reports(status);

CREATE TRIGGER trg_quran_reports_updated_at BEFORE
UPDATE
  ON quran_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'quran_reports' ORDER BY ordinal_position;
-- Expected: 10 columns
-- ============================================================
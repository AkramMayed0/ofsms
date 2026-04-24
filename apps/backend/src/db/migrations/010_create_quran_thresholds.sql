-- ============================================================
-- OFSMS Migration 010 — Quran Memorization Thresholds
-- Configurable by GM (FR-016)
-- Depends on: 000_init.sql
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS quran_thresholds (
  id              SERIAL       PRIMARY KEY,
  age_min         SMALLINT     NOT NULL CHECK (age_min >= 0),
  age_max         SMALLINT     NOT NULL CHECK (age_max > age_min),
  min_juz_per_month NUMERIC(4,2) NOT NULL CHECK (min_juz_per_month > 0),
  label           VARCHAR(100),        -- e.g. "أطفال (5-9)" for display
  created_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- No overlapping age ranges allowed
  CONSTRAINT no_overlap EXCLUDE USING gist (
    int4range(age_min, age_max, '[]') WITH &&
  )
);

CREATE TRIGGER trg_quran_thresholds_updated_at
  BEFORE UPDATE ON quran_thresholds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed reasonable defaults
INSERT INTO quran_thresholds (age_min, age_max, min_juz_per_month, label) VALUES
  (5,  9,  0.25, 'أطفال صغار (5-9)'),
  (10, 13, 0.50, 'أطفال (10-13)'),
  (14, 17, 1.00, 'مراهقون (14-17)'),
  (18, 99, 1.00, 'بالغون (18+)')
ON CONFLICT DO NOTHING;
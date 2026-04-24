-- ============================================================
-- OFSMS Migration 010 — Quran Thresholds Config
-- Depends on: 000_init.sql
--
-- Stores configurable minimum juz memorization per month
-- per orphan age range. GM can update these via the API.
-- Used by quran report submission to determine if an orphan
-- met the monthly requirement (FR-016).
-- ============================================================

CREATE TABLE IF NOT EXISTS quran_thresholds (
  id                 SERIAL       PRIMARY KEY,
  age_min            SMALLINT     NOT NULL CHECK (age_min >= 0),
  age_max            SMALLINT     NOT NULL CHECK (age_max > age_min),
  min_juz_per_month  NUMERIC(4,2) NOT NULL CHECK (min_juz_per_month >= 0),
  label              VARCHAR(100),          -- human-readable label e.g. "6-9 سنوات"
  updated_by         UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Enforce no overlapping age ranges
  CONSTRAINT quran_thresholds_age_range_unique UNIQUE (age_min, age_max)
);

-- ── Seed with reasonable defaults ─────────────────────────────────────────────
-- Based on typical Islamic education expectations per age group
INSERT INTO quran_thresholds (age_min, age_max, min_juz_per_month, label)
VALUES
  (4,  6,  0.25, '4-6 سنوات'),    -- very young: quarter juz/month
  (7,  9,  0.50, '7-9 سنوات'),    -- early stage: half juz/month
  (10, 12, 1.00, '10-12 سنة'),    -- developing: 1 juz/month
  (13, 15, 1.50, '13-15 سنة'),    -- intermediate: 1.5 juz/month
  (16, 18, 2.00, '16-18 سنة'),    -- advanced: 2 juz/month
  (19, 99, 1.00, '19+ سنة')       -- adults: 1 juz/month
ON CONFLICT (age_min, age_max) DO NOTHING;

-- ============================================================
-- Verify:
--   SELECT * FROM quran_thresholds ORDER BY age_min;
-- Expected: 6 rows with the seeded defaults above
-- ============================================================

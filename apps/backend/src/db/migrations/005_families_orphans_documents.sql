-- ============================================================
-- OFSMS Migration 002 — Families, Orphans & Documents
-- Depends on: 000_init.sql (users, governorates, ENUMs)
--             001_sponsors.sql (sponsorships)
-- ============================================================
-- ── Families ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name VARCHAR(150) NOT NULL,
  head_of_family VARCHAR(150) NOT NULL,
  member_count SMALLINT NOT NULL CHECK (member_count > 0),
  governorate_id INTEGER NOT NULL REFERENCES governorates(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status beneficiary_status NOT NULL DEFAULT 'under_review',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_status ON families(status);

CREATE INDEX IF NOT EXISTS idx_families_agent ON families(agent_id);

CREATE INDEX IF NOT EXISTS idx_families_governorate ON families(governorate_id);

DROP TRIGGER IF EXISTS trg_families_updated_at ON families;

CREATE TRIGGER trg_families_updated_at BEFORE
UPDATE
  ON families FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Orphans ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orphans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(6) NOT NULL CHECK (gender IN ('male', 'female')),
  governorate_id INTEGER NOT NULL REFERENCES governorates(id) ON DELETE RESTRICT,
  guardian_name VARCHAR(150) NOT NULL,
  guardian_relation VARCHAR(20) NOT NULL CHECK (
    guardian_relation IN (
      'uncle',
      'maternal_uncle',
      'grandfather',
      'sibling',
      'other'
    )
  ),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status beneficiary_status NOT NULL DEFAULT 'under_review',
  is_gifted BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orphans_status ON orphans(status);

CREATE INDEX IF NOT EXISTS idx_orphans_agent ON orphans(agent_id);

CREATE INDEX IF NOT EXISTS idx_orphans_governorate ON orphans(governorate_id);

CREATE INDEX IF NOT EXISTS idx_orphans_is_gifted ON orphans(is_gifted);

DROP TRIGGER IF EXISTS trg_orphans_updated_at ON orphans;

CREATE TRIGGER trg_orphans_updated_at BEFORE
UPDATE
  ON orphans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('orphan', 'family')),
  entity_id UUID NOT NULL,
  doc_type VARCHAR(30) NOT NULL CHECK (
    doc_type IN (
      'death_certificate',
      'birth_certificate',
      'guardian_id',
      'other'
    )
  ),
  file_key TEXT NOT NULL,
  original_name VARCHAR(255),
  uploaded_by UUID REFERENCES users(id) ON DELETE
  SET
    NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by);

-- ============================================================
-- Verify:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('families','orphans','documents');
-- ============================================================
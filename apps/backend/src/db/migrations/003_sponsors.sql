-- ============================================================
-- OFSMS Migration 001 — Sponsors & Sponsorships
-- Depends on: 000_init.sql (users, governorates, ENUMs)
-- ============================================================
-- ── Sponsors ─────────────────────────────────────────────────
-- A sponsor (كافل) is a donor who funds one or more orphans/families.
-- They access the system via a unique portal link, not the main app.
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  -- Portal access: sponsor logs in via a unique URL token + password
  -- e.g. https://ofsms.org/sponsor/portal?token=<portal_token>
  portal_token VARCHAR(100) NOT NULL UNIQUE,
  portal_password_hash TEXT NOT NULL,
  -- Who created this sponsor record (must be a GM)
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_portal_token ON sponsors(portal_token);

CREATE INDEX IF NOT EXISTS idx_sponsors_email ON sponsors(email);

-- Auto-update updated_at
CREATE TRIGGER trg_sponsors_updated_at BEFORE
UPDATE
  ON sponsors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Sponsorships ──────────────────────────────────────────────
-- Links a sponsor to a beneficiary (orphan OR family).
-- Only ONE active sponsorship per beneficiary at a time.
-- Past sponsorships are kept for full audit history.
--
-- beneficiary_type: 'orphan' | 'family'
-- beneficiary_id:   UUID of the orphan or family record
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The sponsor funding this beneficiary
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
  -- Polymorphic reference to orphan or family
  beneficiary_type VARCHAR(10) NOT NULL CHECK (beneficiary_type IN ('orphan', 'family')),
  beneficiary_id UUID NOT NULL,
  -- The agent responsible for distributing funds to this beneficiary
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Intermediary/broker who facilitated the sponsorship (optional)
  intermediary VARCHAR(150),
  -- Sponsorship financial details
  start_date DATE NOT NULL,
  monthly_amount NUMERIC(10, 2) NOT NULL CHECK (monthly_amount > 0),
  -- is_active=true means this is the CURRENT active sponsorship
  -- Only one active sponsorship per beneficiary (enforced by partial unique index below)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Set when sponsorship ends (transfer, withdrawal, etc.)
  end_date DATE,
  end_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce: only ONE active sponsorship per beneficiary at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsorships_one_active ON sponsorships(beneficiary_type, beneficiary_id)
WHERE
  is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_id);

CREATE INDEX IF NOT EXISTS idx_sponsorships_beneficiary ON sponsorships(beneficiary_type, beneficiary_id);

CREATE INDEX IF NOT EXISTS idx_sponsorships_agent ON sponsorships(agent_id);

-- Auto-update updated_at
CREATE TRIGGER trg_sponsorships_updated_at BEFORE
UPDATE
  ON sponsorships FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN ('sponsors','sponsorships');
-- ============================================================
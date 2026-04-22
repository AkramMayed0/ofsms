-- ============================================================
-- OFSMS Migration 007 — Disbursements
-- Depends on: 002_families_orphans_documents.sql (orphans, families)
--             001_create_users.sql (users)
-- ============================================================

-- ── DisbursementList ─────────────────────────────────────────
-- One list per month/year cycle. Tracks the full approval chain:
--   draft → supervisor_approved → finance_approved → released
--   (or rejected at any stage, which sends it back)

CREATE TABLE IF NOT EXISTS disbursement_lists (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Billing period
  month                 SMALLINT    NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                  SMALLINT    NOT NULL CHECK (year >= 2020),

  -- Workflow status
  status                disbursement_status NOT NULL DEFAULT 'draft',

  -- Approval chain (nullable until each stage is reached)
  created_by            UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by_supervisor UUID       REFERENCES users(id) ON DELETE SET NULL,
  approved_by_finance   UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_by_gm        UUID        REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps for each approval step
  supervisor_approved_at TIMESTAMPTZ,
  finance_approved_at    TIMESTAMPTZ,
  gm_approved_at         TIMESTAMPTZ,

  -- Optional rejection notes
  rejection_notes       TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one list per month/year
  UNIQUE (month, year)
);

CREATE INDEX IF NOT EXISTS idx_disbursement_lists_status ON disbursement_lists(status);
CREATE INDEX IF NOT EXISTS idx_disbursement_lists_period ON disbursement_lists(year, month);

CREATE TRIGGER trg_disbursement_lists_updated_at
  BEFORE UPDATE ON disbursement_lists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── DisbursementItem ─────────────────────────────────────────
-- One row per beneficiary per disbursement cycle.
-- Either orphan_id OR family_id is set (not both).
-- included=false means they were excluded this month (e.g. failed Quran quota).

CREATE TABLE IF NOT EXISTS disbursement_items (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which monthly list this belongs to
  list_id           UUID        NOT NULL
                      REFERENCES disbursement_lists(id)
                      ON DELETE CASCADE,

  -- Exactly one of these must be set (enforced by CHECK below)
  orphan_id         UUID        REFERENCES orphans(id) ON DELETE RESTRICT,
  family_id         UUID        REFERENCES families(id) ON DELETE RESTRICT,

  -- The sponsorship amount for this cycle
  amount            NUMERIC(10, 2) NOT NULL CHECK (amount > 0),

  -- Whether this beneficiary is included in the payout
  included          BOOLEAN     NOT NULL DEFAULT TRUE,

  -- If excluded, why (e.g. 'لم يستوفِ حصة الحفظ الشهرية')
  exclusion_reason  TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce: exactly one beneficiary type per row
  CONSTRAINT chk_one_beneficiary CHECK (
    (orphan_id IS NOT NULL AND family_id IS NULL) OR
    (orphan_id IS NULL AND family_id IS NOT NULL)
  ),

  -- One row per beneficiary per list
  CONSTRAINT uq_item_orphan_per_list  UNIQUE (list_id, orphan_id),
  CONSTRAINT uq_item_family_per_list  UNIQUE (list_id, family_id)
);

CREATE INDEX IF NOT EXISTS idx_disbursement_items_list    ON disbursement_items(list_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_items_orphan  ON disbursement_items(orphan_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_items_family  ON disbursement_items(family_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_items_included ON disbursement_items(included);

-- ── BiometricReceipt ─────────────────────────────────────────
-- Fingerprint confirmation captured by the agent's device
-- after physically handing money to the orphan/family.

CREATE TABLE IF NOT EXISTS biometric_receipts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which disbursement item this confirms
  item_id           UUID        NOT NULL UNIQUE
                      REFERENCES disbursement_items(id)
                      ON DELETE CASCADE,

  -- The agent who captured the fingerprint
  agent_id          UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- S3 key for the fingerprint image (e.g. "biometrics/uuid.png")
  fingerprint_key   TEXT        NOT NULL,

  confirmed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_receipts_agent ON biometric_receipts(agent_id);
CREATE INDEX IF NOT EXISTS idx_biometric_receipts_item  ON biometric_receipts(item_id);

-- ============================================================
-- Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN (
--     'disbursement_lists', 'disbursement_items', 'biometric_receipts'
--   );
-- Expected: 3 rows
-- ============================================================
-- ============================================================
-- OFSMS Migration 004 — Orphan Documents
-- Depends on: 001_create_users.sql (users table)
--             003_sponsors.sql     (orphans table must exist first)
--
-- Stores uploaded registration documents for each orphan.
-- Files themselves live in S3; only the key/URL is stored here.
-- ============================================================
-- ── Doc type enum ─────────────────────────────────────────────
-- Extensible: new types can be added without breaking existing rows.
CREATE TYPE doc_type AS ENUM (
  'death_cert',
  -- شهادة وفاة الأب   (required)
  'birth_cert',
  -- شهادة الميلاد     (required)
  'guardian_id',
  -- هوية الوصي        (optional)
  'other' -- مستندات إضافية    (up to 5, configurable)
);

-- ── Orphan Documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orphan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The orphan this document belongs to
  orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
  -- delete docs when orphan is deleted
  -- Document classification
  doc_type doc_type NOT NULL,
  -- S3 object key (e.g. "documents/uuid.pdf")
  -- Use s3.getSignedUrl(file_key) at read time — never store a signed URL
  file_key TEXT NOT NULL,
  -- Human-readable original filename (for display in UI)
  original_name VARCHAR(255),
  -- MIME type for correct Content-Type header when serving
  mime_type VARCHAR(100),
  -- File size in bytes (used for storage quota checks in future)
  file_size_bytes INTEGER,
  -- Who uploaded this document (the agent)
  uploaded_by UUID REFERENCES users(id) ON DELETE
  SET
    NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
-- Most common query: "give me all documents for orphan X"
CREATE INDEX IF NOT EXISTS idx_orphan_documents_orphan_id ON orphan_documents(orphan_id);

-- Secondary: filter by document type within an orphan
CREATE INDEX IF NOT EXISTS idx_orphan_documents_type ON orphan_documents(orphan_id, doc_type);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE TRIGGER trg_orphan_documents_updated_at BEFORE
UPDATE
  ON orphan_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Verify with:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'orphan_documents'
--   ORDER BY ordinal_position;
-- Expected: 10 columns — id, orphan_id, doc_type, file_key,
--           original_name, mime_type, file_size_bytes,
--           uploaded_by, uploaded_at, updated_at
-- ============================================================
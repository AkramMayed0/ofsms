-- OFSMS Migration 018 — Public Landing Page CMS Content
CREATE TABLE IF NOT EXISTS landing_content (
  key VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_landing_content_updated_at BEFORE
UPDATE ON landing_content FOR EACH ROW EXECUTE FUNCTION set_updated_at();

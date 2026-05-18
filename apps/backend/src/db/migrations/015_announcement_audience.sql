-- OFSMS Migration 015 - Scope announcements to staff or sponsor interfaces.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'staff';

ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_audience_check;

ALTER TABLE announcements
  ADD CONSTRAINT announcements_audience_check
  CHECK (audience IN ('staff', 'sponsor'));

CREATE INDEX IF NOT EXISTS idx_announcements_audience_active
  ON announcements(audience, is_active, published_at DESC);

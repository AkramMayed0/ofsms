-- OFSMS Migration 017 - Target ads to all sponsors or selected sponsors.
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS target_all BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS ad_recipients (
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ad_id, sponsor_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_recipients_sponsor ON ad_recipients(sponsor_id);

ALTER TABLE ad_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_recipients_select_authenticated ON ad_recipients;
CREATE POLICY ad_recipients_select_authenticated
  ON ad_recipients FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS ad_recipients_insert_admin_only ON ad_recipients;
CREATE POLICY ad_recipients_insert_admin_only
  ON ad_recipients FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS ad_recipients_delete_admin_only ON ad_recipients;
CREATE POLICY ad_recipients_delete_admin_only
  ON ad_recipients FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

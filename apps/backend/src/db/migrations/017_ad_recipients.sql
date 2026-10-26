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

-- Row-level security only exists on Supabase (needs the `authenticated` role and auth.jwt()).
-- On plain PostgreSQL (Railway, local) this block is skipped; the API checks roles itself.
DO $rls$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     AND EXISTS (
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'auth' AND p.proname = 'jwt'
     ) THEN
    EXECUTE $q$
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
    $q$;
  END IF;
END
$rls$;

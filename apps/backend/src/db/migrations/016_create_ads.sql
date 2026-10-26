-- OFSMS Migration 016 - Sponsor-facing ads feed.
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type VARCHAR(10) NOT NULL CHECK (beneficiary_type IN ('orphan', 'family')),
  beneficiary_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_beneficiary ON ads(beneficiary_type, beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ads_published ON ads(published_at DESC);

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
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ads_select_authenticated ON ads;
CREATE POLICY ads_select_authenticated
  ON ads FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS ads_insert_admin_only ON ads;
CREATE POLICY ads_insert_admin_only
  ON ads FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS ads_delete_admin_only ON ads;
CREATE POLICY ads_delete_admin_only
  ON ads FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');
    $q$;
  END IF;
END
$rls$;

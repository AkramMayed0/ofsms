-- OFSMS Migration 024 - Disable the built-in demo admin.
--
-- Migration 001 creates admin@ofsms.local with a password that is public in the repository
-- (Admin@1234). Deactivate it unless someone has already changed its password.
-- Create the real first admin with:  npm run create-admin   (see RAILWAY_DEPLOY.md)
UPDATE users
SET is_active = FALSE
WHERE email = 'admin@ofsms.local'
  AND password_hash = '$2b$12$bUsgTfDtYDb9pF/wVDNOuur4CB8QCGjrj4YtrCsurW.Ll/XvKdDTu';

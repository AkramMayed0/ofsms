/**
 * create-admin.js — create (or reset) the first General Manager account on a live database.
 *
 * Usage (Railway: run in the backend service shell, or locally with DATABASE_URL set):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' ADMIN_NAME='اسم المدير' npm run create-admin
 *
 * Unlike create-test-user.js this takes the credentials from the environment, so no
 * well-known password ever reaches a real database.
 *
 * Modes:
 *   (default)         create the admin, or RESET its password if the email already exists
 *   --if-configured   used by the Railway pre-deploy step: do nothing when ADMIN_EMAIL /
 *                     ADMIN_PASSWORD are not set, and never touch an account that already
 *                     exists (so a password changed inside the app is not overwritten)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/db');

async function main() {
  const ifConfigured = process.argv.includes('--if-configured');
  if (ifConfigured && !(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)) {
    console.log('ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation.');
    await pool.end();
    return;
  }

  const email    = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name     = (process.env.ADMIN_NAME || 'مدير النظام').trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Set ADMIN_EMAIL to a valid email address');
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters');

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'gm', TRUE)
     ON CONFLICT (email) DO ${ifConfigured
       ? 'NOTHING'
       : "UPDATE SET password_hash = EXCLUDED.password_hash, role = 'gm', is_active = TRUE"}
     RETURNING id, email, role`,
    [name, email, hash]
  );
  if (rows[0]) console.log('✅ Admin ready:', rows[0].email, `(${rows[0].role})`);
  else console.log('ℹ️  Admin already exists — left unchanged.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});

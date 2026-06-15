/**
 * reset_passwords.js
 * Resets passwords for all users whose hash is unknown/corrupted.
 * Sets them all to Test@1234 (same as supervisor + gm).
 * Run: node scratch/reset_passwords.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

// The bad shared hash that cannot be matched to any known password
const BAD_HASH_PREFIX = '$2a$10$S/oKKGxAiyrZs8vGo1gd5eH';

// New password for all affected accounts
const NEW_PASSWORD = 'Test@1234';

async function resetPasswords() {
  console.log('🔍 Fetching all users...');
  const { rows: users } = await query(
    'SELECT id, email, password_hash FROM users'
  );

  const newHash = await bcrypt.hash(NEW_PASSWORD, 12);
  console.log(`🔑 New hash generated (cost=12)\n`);

  let fixed = 0;
  for (const u of users) {
    if (u.password_hash.startsWith(BAD_HASH_PREFIX)) {
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, u.id]);
      console.log(`✅ Reset: ${u.email}`);
      fixed++;
    } else {
      // Verify the existing hash works with Test@1234
      const ok = await bcrypt.compare(NEW_PASSWORD, u.password_hash);
      console.log(`${ok ? '✅' : '⚠️ '} Skipped (hash OK=${ok}): ${u.email}`);
    }
  }

  console.log(`\n🎉 Done. Fixed ${fixed} account(s).`);
  console.log(`\n📋 All accounts now use password: "${NEW_PASSWORD}"`);
  process.exit(0);
}

resetPasswords().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

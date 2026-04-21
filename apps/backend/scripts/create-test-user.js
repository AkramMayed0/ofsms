/**
 * create-test-user.js
 * Usage: node scripts/create-test-user.js
 *
 * Creates a GM test account in the database.
 * Only for local/dev use — never run in production.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

async function main() {
  const email    = 'gm@ofsms.local';
  const password = 'Test@1234';
  const name     = 'مدير النظام';
  const role     = 'gm';

  const hash = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, role`,
    [name, email, hash, role]
  );

  console.log('✅ Test user ready:', rows[0]);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

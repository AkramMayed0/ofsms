/**
 * create-test-accounts.js
 * Usage: node scripts/create-test-accounts.js
 *
 * Creates test accounts for all remaining roles:
 *   - agent
 *   - finance
 *
 * Also creates a test sponsor record (via the sponsors table, not users).
 *
 * Only for local/dev use — never run in production.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, pool } = require('../src/config/db');

const accounts = [
  { email: 'agent@ofsms.local',   password: 'Test@1234', name: 'مندوب التسجيل',  role: 'agent'    },
  { email: 'finance@ofsms.local', password: 'Test@1234', name: 'المسؤول المالي', role: 'finance'  },
];

async function main() {
  // 1. Create staff users
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 12);
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`,
      [acc.name, acc.email, hash, acc.role]
    );
    console.log(`✅ ${acc.role} ready:`, rows[0]);
    console.log(`   Email:    ${acc.email}`);
    console.log(`   Password: ${acc.password}\n`);
  }

  // 2. Create a test sponsor (uses separate sponsors table, not users)
  // First get the GM's id to use as created_by
  const { rows: gmRows } = await query(
    `SELECT id FROM users WHERE role = 'gm' LIMIT 1`
  );

  if (gmRows.length === 0) {
    console.warn('⚠️  No GM found — skipping sponsor seed. Run create-test-user.js first.');
    process.exit(0);
  }

  const gmId = gmRows[0].id;
  const portalToken = crypto.randomBytes(32).toString('hex');
  const portalPassword = 'Sponsor@1234';
  const portalPasswordHash = await bcrypt.hash(portalPassword, 12);

  const { rows: sponsorRows } = await query(
    `INSERT INTO sponsors
       (full_name, phone, email, portal_token, portal_password_hash, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING
     RETURNING id, full_name, portal_token`,
    ['كافل تجريبي', '+967700000001', 'sponsor@test.local', portalToken, portalPasswordHash, gmId]
  );

  if (sponsorRows[0]) {
    console.log('✅ Test sponsor created:');
    console.log(`   Name:           كافل تجريبي`);
    console.log(`   Portal token:   ${sponsorRows[0].portal_token}`);
    console.log(`   Portal password: ${portalPassword}`);
    console.log(`   Portal URL:     http://localhost:3000/sponsor/portal?token=${sponsorRows[0].portal_token}\n`);
  } else {
    console.log('ℹ️  Sponsor already exists — skipped.');
  }

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

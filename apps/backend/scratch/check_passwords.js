require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

const candidates = [
  'Test@1234', 'test@1234', 'Admin@1234', 'admin@1234',
  'Pass@1234', 'Ofsms@1234', '123456', 'password',
  'Agent@1234', 'Finance@1234', 'Supervisor@1234',
  'ofsms1234', 'Ofsms1234',
];

async function check() {
  const { rows } = await query(
    `SELECT email, password_hash FROM users
     WHERE email IN ('agent@ofsms.local', 'finance@ofsms.local', 'supervisor@ofsms.local', 'admin@ofsms.local', 'agent2@ofsms.local')`
  );

  for (const u of rows) {
    let found = false;
    for (const c of candidates) {
      const ok = await bcrypt.compare(c, u.password_hash);
      if (ok) {
        console.log(`✅ ${u.email}  =>  password: "${c}"`);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`❌ ${u.email}  =>  password NOT in candidate list (hash: ${u.password_hash.slice(0,30)}...)`);
    }
  }
  process.exit(0);
}

check();

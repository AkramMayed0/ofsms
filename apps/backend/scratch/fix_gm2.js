require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

async function fix() {
  const hash = await bcrypt.hash('Test@1234', 12);
  await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'gm2@ofsms.local']);
  console.log('✅ gm2@ofsms.local password reset to Test@1234');
  process.exit(0);
}
fix().catch(e => { console.error(e.message); process.exit(1); });

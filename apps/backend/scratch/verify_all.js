require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const { query } = require('../src/config/db');

async function verify() {
  const { rows } = await query('SELECT email, password_hash FROM users ORDER BY created_at');
  console.log('Testing all accounts with password "Test@1234":\n');
  let allOk = true;
  for (const u of rows) {
    const ok = await bcrypt.compare('Test@1234', u.password_hash);
    console.log(`${ok ? '✅' : '❌'} ${u.email}`);
    if (!ok) allOk = false;
  }
  console.log(allOk ? '\n🎉 All accounts are working!' : '\n⚠️  Some accounts still have unknown passwords.');
  process.exit(0);
}
verify().catch(e => { console.error(e.message); process.exit(1); });

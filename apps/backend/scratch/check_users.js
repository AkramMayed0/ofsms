require('dotenv').config({ path: __dirname + '/../.env' });
const { query } = require('../src/config/db');

async function check() {
  const { rows } = await query('SELECT id, full_name, email, role, is_active FROM users');
  console.log(rows);
  process.exit(0);
}
check();

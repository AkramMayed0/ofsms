require('dotenv').config({ path: __dirname + '/../.env' });
const { query } = require('../src/config/db');

async function check() {
  const { rows } = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sponsors' ORDER BY ordinal_position`);
  console.log(rows.map(c => c.column_name));
  process.exit(0);
}
check();

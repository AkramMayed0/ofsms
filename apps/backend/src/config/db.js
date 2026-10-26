const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL in production, except when DATABASE_SSL=false or the URL points at Railway's private network
  ssl: process.env.NODE_ENV === 'production'
    && process.env.DATABASE_SSL !== 'false'
    && !/@[^/:@]*\.railway\.internal(:|\/)/.test(process.env.DATABASE_URL || '')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
  process.exit(-1);
});

/**
 * Run a parameterized query.
 * @param {string} text  - SQL string with $1, $2, … placeholders
 * @param {Array}  params - Parameter values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };

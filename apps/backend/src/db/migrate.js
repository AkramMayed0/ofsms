/**
 * migrate.js — OFSMS database migration runner
 *
 * Usage:
 *   node src/db/migrate.js           → run all pending migrations
 *   node src/db/migrate.js --dry-run → print SQL without executing
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return new Set(rows.map((r) => r.filename));
}

async function runMigrations() {
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅ No pending migrations. Database is up to date.');
      return;
    }

    console.log(`📦 Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`▶  Running: ${file}`);

      if (isDryRun) {
        console.log('--- DRY RUN ---\n', sql, '\n---------------\n');
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`   ✅ Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed:  ${file}\n   ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\n🎉 All migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration runner error:', err);
  process.exit(1);
});

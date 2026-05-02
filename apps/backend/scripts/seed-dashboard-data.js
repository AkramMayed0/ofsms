/**
 * seed-dashboard-data.js
 * Usage: node scripts/seed-dashboard-data.js
 *
 * Seeds:
 * - agent user
 * - orphans linked to agent
 * - reports
 * - submissions
 *
 * For testing dashboard only.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/db');

async function main() {
  try {
    console.log('🚀 Seeding dashboard data...\n');

    // 1. Create agent
    const password = 'Test@1234';
    const hash = await bcrypt.hash(password, 12);

    const { rows: agentRows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, role`,
      ['Agent Test', 'agent@test.com', hash, 'agent']
    );

    const agentId = agentRows[0].id;

    console.log('✅ Agent ready:', agentId);

    // 2. Clean old data (important unless you enjoy duplicates)
    await query(`DELETE FROM orphans WHERE agent_id = $1`, [agentId]);
    await query(`DELETE FROM reports WHERE agent_id = $1`, [agentId]);
    await query(`DELETE FROM submissions WHERE agent_id = $1`, [agentId]);

    console.log('🧹 Old data cleared');

    // 3. Create orphans
    for (let i = 1; i <= 3; i++) {
      await query(
        `INSERT INTO orphans (name, age, agent_id)
         VALUES ($1, $2, $3)`,
        [`Orphan ${i}`, 10 + i, agentId]
      );
    }

    console.log('✅ Orphans created');

    // 4. Create reports
    for (let i = 1; i <= 2; i++) {
      await query(
        `INSERT INTO reports (title, status, agent_id)
         VALUES ($1, $2, $3)`,
        [`Report ${i}`, 'pending', agentId]
      );
    }

    console.log('✅ Reports created');

    // 5. Create submissions
    for (let i = 1; i <= 2; i++) {
      await query(
        `INSERT INTO submissions (status, agent_id)
         VALUES ($1, $2)`,
        ['submitted', agentId]
      );
    }

    console.log('✅ Submissions created');

    console.log('\n🔐 Login Info:');
    console.log('Email: agent@test.com');
    console.log('Password: Test@1234');

    console.log('\n🎯 Ready to test:');
    console.log('1. Login → get token');
    console.log('2. Call /api/dashboard/agent with token');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    await pool.end();
    process.exit(1);
  }
}

main();
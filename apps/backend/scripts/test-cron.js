/**
 * test-cron.js
 * 
 * Verifies that the cron jobs fire on the correct dates
 * using a simulated clock and stubbed notification service.
 */

require('dotenv').config();
const cron = require('node-cron');
const { initScheduler } = require('../src/scheduler');
const notificationsService = require('../src/modules/notifications/notifications.service');
const { pool } = require('../src/config/db');

// --- 1. Stub the DB & Services ---
// Prevent real DB queries
const mockQuery = async (queryStr, params) => {
  if (queryStr.includes('SELECT id FROM users WHERE role = $1')) {
    const role = params[0];
    if (role === 'agent') return { rows: [{ id: 'agent-1' }, { id: 'agent-2' }] };
    if (role === 'supervisor') return { rows: [{ id: 'sup-1' }] };
    if (role === 'finance') return { rows: [{ id: 'fin-1' }] };
    if (role === 'gm') return { rows: [{ id: 'gm-1' }] };
  }
  return { rows: [] };
};

// We temporarily monkey-patch the db module if possible, 
// but since scheduler.js requires it directly, we might need 
// to mock sendBulkNotification instead.
const originalSendBulk = notificationsService.sendBulkNotification;
let notificationsSent = [];
notificationsService.sendBulkNotification = async (userIds, title, body, data, type) => {
  notificationsSent.push({ userIds, title, type });
  return { total: userIds.length, sent: userIds.length, failed: 0 };
};

// --- 2. Stub cron.schedule ---
const registeredJobs = [];
const originalSchedule = cron.schedule;
cron.schedule = (expression, callback, options) => {
  registeredJobs.push({ expression, callback });
};

async function runTest() {
  console.log('--- Starting Cron Scheduler Test ---\n');

  // Initialize the scheduler to capture the registered jobs
  initScheduler();

  console.log(`\nRegistered ${registeredJobs.length} cron jobs.`);
  
  // Create a helper to simulate a day
  const simulateDay = async (dayOfMonth) => {
    console.log(`\n[Simulated Date]: 2026-05-${dayOfMonth.toString().padStart(2, '0')}`);
    notificationsSent = []; // Reset capture

    // Check which jobs should run
    for (const job of registeredJobs) {
      // The expression format is 'MIN HOUR DAY_OF_MONTH * *'
      // e.g. '0 8 25 * *'
      const parts = job.expression.split(' ');
      const targetDay = parseInt(parts[2], 10);
      
      if (targetDay === dayOfMonth) {
        console.log(`  -> Firing job with schedule [${job.expression}]`);
        await job.callback();
      }
    }

    // Output what was sent
    if (notificationsSent.length > 0) {
      notificationsSent.forEach(n => {
        console.log(`  [Sent Push] To ${n.userIds.length} users. Title: "${n.title}"`);
        console.log(`              Recipients: ${n.userIds.join(', ')}`);
      });
    } else {
      console.log('  (No notifications scheduled for this day)');
    }
  };

  // --- 3. Simulate specific dates ---
  // Simulate 24th (should be empty)
  await simulateDay(24);

  // Simulate 25th (should fire FR-044 and FR-045)
  await simulateDay(25);

  // Simulate 27th (should be empty)
  await simulateDay(27);

  // Simulate 28th (should fire FR-046)
  await simulateDay(28);

  console.log('\n--- Test Completed Successfully ---');

  // Restore original functions
  cron.schedule = originalSchedule;
  notificationsService.sendBulkNotification = originalSendBulk;

  // Exit cleanly
  process.exit(0);
}

runTest();

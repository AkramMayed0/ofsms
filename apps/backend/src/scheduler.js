/**
 * scheduler.js — OFSMS Monthly Notification Cron Jobs
 *
 * Implements FR-044 → FR-047 from SADD:
 *
 *   FR-044: 25th of each month → remind ALL agents to submit Quran reports
 *   FR-045: 25th of each month → remind supervisor to follow up on agents
 *   FR-046: 28th of each month → remind supervisor + finance of upcoming disbursement
 *   FR-047: GM receives ALL system notifications regardless of type
 *
 * Uses node-cron (already in package.json).
 * Call initScheduler() once from src/index.js after DB is ready.
 */

const cron = require('node-cron');
const { query } = require('./config/db');
const { sendBulkNotification } = require('./modules/notifications/notifications.service');

// ── Fetch all active user IDs by role ─────────────────────────────────────────
const getUserIdsByRole = async (role) => {
  const { rows } = await query(
    'SELECT id FROM users WHERE role = $1 AND is_active = TRUE',
    [role]
  );
  return rows.map((r) => r.id);
};

const getAllGmIds = () => getUserIdsByRole('gm');
const getAllAgentIds = () => getUserIdsByRole('agent');
const getAllSupervisorIds = () => getUserIdsByRole('supervisor');
const getAllFinanceIds = () => getUserIdsByRole('finance');

// ── Job: 25th — remind agents to submit Quran reports (FR-044) ───────────────
const remindAgentsToSubmitReports = async () => {
  try {
    const [agentIds, gmIds] = await Promise.all([getAllAgentIds(), getAllGmIds()]);

    const title = 'تذكير: رفع تقارير الحفظ';
    const body  = 'يرجى رفع تقارير حفظ القرآن للأيتام قبل نهاية الشهر';

    await sendBulkNotification(agentIds, title, body, {}, 'quran_report_reminder');

    // FR-047: GM also receives this
    await sendBulkNotification(gmIds, title, body, {}, 'quran_report_reminder');

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Quran report reminder sent to ${agentIds.length} agents.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Scheduler] remindAgentsToSubmitReports error:', err.message);
  }
};

// ── Job: 25th — remind supervisor to follow up on agents (FR-045) ─────────────
const remindSupervisorToFollowUp = async () => {
  try {
    const supervisorIds = await getAllSupervisorIds();

    const title = 'تذكير: متابعة رفع التقارير';
    const body  = 'يرجى متابعة المناديب للتأكد من رفع تقارير الحفظ الشهرية';

    await sendBulkNotification(supervisorIds, title, body, {}, 'quran_report_reminder');

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Supervisor follow-up reminder sent to ${supervisorIds.length} supervisors.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Scheduler] remindSupervisorToFollowUp error:', err.message);
  }
};

// ── Job: 28th — disbursement reminder (FR-046) ───────────────────────────────
const remindDisbursementDeadline = async () => {
  try {
    const [supervisorIds, financeIds, gmIds] = await Promise.all([
      getAllSupervisorIds(),
      getAllFinanceIds(),
      getAllGmIds(),
    ]);

    const title = 'تنبيه: اقتراب موعد الصرف';
    const body  = 'موعد الصرف الشهري يقترب. يرجى مراجعة كشف الصرف والمصادقة عليه';

    const allIds = [...new Set([...supervisorIds, ...financeIds, ...gmIds])];
    await sendBulkNotification(allIds, title, body, {}, 'disbursement_reminder');

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Disbursement deadline reminder sent to ${allIds.length} users.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Scheduler] remindDisbursementDeadline error:', err.message);
  }
};

// ── Init: register all cron jobs ──────────────────────────────────────────────
/**
 * Call this once from src/index.js after DB connection is established.
 *
 * Cron format: second(opt) minute hour day-of-month month day-of-week
 * '0 8 25 * *' = 08:00 on the 25th of every month (server local time / UTC)
 */
const initScheduler = () => {
  // FR-044: 25th 08:00 — remind agents
  cron.schedule('0 8 25 * *', remindAgentsToSubmitReports, {
    timezone: 'Asia/Aden', // Yemen timezone
  });

  // FR-045: 25th 08:05 — remind supervisor (5 min after agents)
  cron.schedule('5 8 25 * *', remindSupervisorToFollowUp, {
    timezone: 'Asia/Aden',
  });

  // FR-046: 28th 08:00 — disbursement reminder
  cron.schedule('0 8 28 * *', remindDisbursementDeadline, {
    timezone: 'Asia/Aden',
  });

  // eslint-disable-next-line no-console
  console.log('[Scheduler] Cron jobs registered: 25th (reports) + 28th (disbursement)');
};

module.exports = {
  initScheduler,
  // Export individual jobs for manual testing via REST endpoint
  remindAgentsToSubmitReports,
  remindSupervisorToFollowUp,
  remindDisbursementDeadline,
};

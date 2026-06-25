/**
 * quran.service.js — OFSMS Quran Reports Business Logic Layer
 *
 * Orchestrates Quran report operations using:
 *   - quran.repository.js (data access)
 *   - auditLog utils
 *   - notifications service
 *
 * No SQL lives here. No HTTP knowledge (no req/res/next).
 * All errors carry .statusCode for clean HTTP mapping in the controller.
 */

const repository = require('./quran.repository');
const { logAudit } = require('../../utils/auditLog');
const { sendPushNotification } = require('../notifications/notifications.service');

// ── Helper: throw a domain error with an HTTP status code ─────────────────────
const domainError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Submit a monthly Quran report for an orphan.
 * Validates juz_memorized against the age-appropriate threshold.
 */
const submitReport = async ({ orphanId, agentId, role, month, year, juzMemorized }) => {
  // 1. Check if report already exists
  const existing = await repository.findExistingReport(orphanId, month, year);
  if (existing) throw domainError(`تقرير الحفظ لهذا اليتيم عن شهر ${month}/${year} موجود بالفعل`, 409);

  // 2. Fetch orphan details
  const orphan = await repository.findOrphanById(orphanId);
  if (!orphan) throw domainError('اليتيم غير موجود', 404);

  // 3. Enforce agent ownership — gm can report for any orphan
  if (role !== 'gm' && orphan.agent_id !== agentId) {
    throw domainError('ليس لديك صلاحية لرفع تقرير لهذا اليتيم', 403);
  }

  // 4. Calculate age in years
  const dob = new Date(orphan.date_of_birth);
  const reportDate = new Date(year, month - 1, 1);
  const ageYears = Math.floor((reportDate - dob) / (365.25 * 24 * 60 * 60 * 1000));

  // 5. Fetch threshold
  const thresholdRow = await repository.findThresholdForAge(ageYears);
  const threshold = thresholdRow?.min_juz_per_month ?? null;

  // 6. Insert report
  const report = await repository.upsertReport(orphanId, agentId, month, year, juzMemorized);

  // 7. Audit log
  await logAudit({
    userId:     agentId,
    action:     'quran_report_submitted',
    entityType: 'quran_report',
    entityId:   report.id,
    newValue:   { orphan_id: orphanId, month, year, juz_memorized: juzMemorized },
  });

  return { report, threshold, meets_threshold: threshold !== null ? juzMemorized >= threshold : null };
};

/**
 * Get all pending reports — supervisor queue.
 */
const getPendingReports = async () => {
  return repository.findPendingReports();
};

/**
 * Get all reports submitted by a specific agent.
 */
const getReportsByAgent = async (agentId) => {
  return repository.findReportsByAgent(agentId);
};

/**
 * Get single report by ID (for generic getReportById)
 */
const getReportById = async (id) => {
  return repository.findReportById(id);
};

/**
 * Supervisor approves or rejects a Quran report.
 * On approve: status → approved (orphan included in next disbursement via quran_reports.status)
 * On reject:  status → rejected + push notification to agent (FR-019, FR-020)
 */
const reviewReport = async ({ reportId, action, notes, reviewerId, reviewerName }) => {
  if (!['approved', 'rejected'].includes(action)) {
    throw domainError('الإجراء يجب أن يكون approved أو rejected', 400);
  }
  if (action === 'rejected' && !notes?.trim()) {
    throw domainError('ملاحظات الرفض مطلوبة', 422);
  }

  // Fetch report context before updating
  const report = await repository.findReportById(reportId);
  if (!report) throw domainError('التقرير غير موجود', 404);
  if (report.status !== 'pending') {
    throw domainError('لا يمكن مراجعة تقرير تمت معالجته مسبقاً', 409);
  }

  // Update status
  const updated = await repository.updateReportStatus(reportId, action, notes);

  // Audit log
  await logAudit({
    userId:     reviewerId,
    action:     `quran_report_${action}`,
    entityType: 'quran_report',
    entityId:   reportId,
    oldValue:   { status: 'pending' },
    newValue:   { status: action, notes },
  });

  // FR-019 / FR-020: push notification to agent on rejection
  if (action === 'rejected' && report.agent_id) {
    await sendPushNotification(
      report.agent_id,
      'تم رفض تقرير الحفظ',
      `تم رفض تقرير حفظ القرآن للشهر ${report.month}/${report.year} لليتيم ${report.orphan_name} من قِبَل ${reviewerName}. السبب: ${notes}`,
      { reportId, action: 'quran_report_rejected' },
      'general',
      reportId
    );
  }

  return updated;
};

module.exports = {
  submitReport,
  getPendingReports,
  getReportsByAgent,
  getReportById,
  reviewReport,
};

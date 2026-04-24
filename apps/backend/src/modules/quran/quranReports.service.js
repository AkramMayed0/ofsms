const { query } = require('../../config/db');
const { logAudit } = require('../../utils/auditLog');

/**
 * Submit a monthly Quran report for an orphan.
 * Validates juz_memorized against the age-appropriate threshold.
 */
const submitReport = async ({ orphanId, agentId, month, year, juzMemorized }) => {
  // 1. Get orphan's date_of_birth to calculate age
  const { rows: orphanRows } = await query(
    'SELECT id, full_name, date_of_birth, agent_id FROM orphans WHERE id = $1',
    [orphanId]
  );
  const orphan = orphanRows[0];
  if (!orphan) throw Object.assign(new Error('اليتيم غير موجود'), { status: 404 });

  // 2. Enforce agent ownership — agent can only report their own orphans
  if (orphan.agent_id !== agentId) {
    throw Object.assign(new Error('ليس لديك صلاحية لرفع تقرير لهذا اليتيم'), { status: 403 });
  }

  // 3. Calculate age in years
  const dob = new Date(orphan.date_of_birth);
  const reportDate = new Date(year, month - 1, 1);
  const ageYears = Math.floor((reportDate - dob) / (365.25 * 24 * 60 * 60 * 1000));

  // 4. Fetch the matching threshold for this age
  const { rows: thresholdRows } = await query(
    `SELECT min_juz_per_month FROM quran_thresholds
     WHERE age_min <= $1 AND age_max >= $1
     LIMIT 1`,
    [ageYears]
  );

  const threshold = thresholdRows[0]?.min_juz_per_month ?? null;

  // 5. Insert report — status is always 'pending' on submission
  const { rows } = await query(
    `INSERT INTO quran_reports
       (orphan_id, agent_id, month, year, juz_memorized, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (orphan_id, month, year)
     DO UPDATE SET juz_memorized = EXCLUDED.juz_memorized,
                   status = 'pending',
                   submitted_at = NOW()
     RETURNING *`,
    [orphanId, agentId, month, year, juzMemorized]
  );
  const report = rows[0];

  // 6. Audit log
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
  const { rows } = await query(
    `SELECT
       qr.id, qr.month, qr.year, qr.juz_memorized, qr.status, qr.submitted_at,
       o.full_name AS orphan_name, o.date_of_birth,
       g.name_ar  AS governorate_ar,
       u.full_name AS agent_name,
       qt.min_juz_per_month AS threshold
     FROM quran_reports qr
     JOIN orphans      o  ON o.id  = qr.orphan_id
     JOIN governorates g  ON g.id  = o.governorate_id
     JOIN users        u  ON u.id  = qr.agent_id
     LEFT JOIN quran_thresholds qt
       ON qt.age_min <= DATE_PART('year', AGE(o.date_of_birth))
      AND qt.age_max >= DATE_PART('year', AGE(o.date_of_birth))
     WHERE qr.status = 'pending'
     ORDER BY qr.submitted_at ASC`
  );
  return rows;
};

/**
 * Get all reports submitted by a specific agent.
 */
const getReportsByAgent = async (agentId) => {
  const { rows } = await query(
    `SELECT
       qr.id, qr.month, qr.year, qr.juz_memorized,
       qr.status, qr.submitted_at, qr.supervisor_notes,
       o.full_name AS orphan_name
     FROM quran_reports qr
     JOIN orphans o ON o.id = qr.orphan_id
     WHERE qr.agent_id = $1
     ORDER BY qr.year DESC, qr.month DESC`,
    [agentId]
  );
  return rows;
};

const { sendPushNotification } = require('../notifications/notifications.service');

/**
 * Supervisor approves or rejects a Quran report.
 * On approve: status → approved (orphan included in next disbursement via quran_reports.status)
 * On reject:  status → rejected + push notification to agent (FR-019, FR-020)
 */
const reviewReport = async ({ reportId, action, notes, reviewerId, reviewerName }) => {
  if (!['approved', 'rejected'].includes(action)) {
    throw Object.assign(new Error('الإجراء يجب أن يكون approved أو rejected'), { status: 400 });
  }
  if (action === 'rejected' && !notes?.trim()) {
    throw Object.assign(new Error('ملاحظات الرفض مطلوبة'), { status: 422 });
  }

  // Fetch report + orphan info before updating
  const { rows: existing } = await query(
    `SELECT qr.*, o.full_name AS orphan_name, o.agent_id
     FROM quran_reports qr
     JOIN orphans o ON o.id = qr.orphan_id
     WHERE qr.id = $1`,
    [reportId]
  );
  const report = existing[0];
  if (!report) throw Object.assign(new Error('التقرير غير موجود'), { status: 404 });
  if (report.status !== 'pending') {
    throw Object.assign(new Error('لا يمكن مراجعة تقرير تمت معالجته مسبقاً'), { status: 409 });
  }

  // Update report status
  const { rows } = await query(
    `UPDATE quran_reports
     SET status = $1, supervisor_notes = $2
     WHERE id = $3
     RETURNING *`,
    [action, notes || null, reportId]
  );
  const updated = rows[0];

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

/**
 * Get all approved orphan IDs for a given month/year.
 * Used by disbursement generation to know who to include.
 */
const getApprovedOrphanIds = async (month, year) => {
  const { rows } = await query(
    `SELECT orphan_id FROM quran_reports
     WHERE month = $1 AND year = $2 AND status = 'approved'`,
    [month, year]
  );
  return rows.map(r => r.orphan_id);
};

module.exports = { submitReport, getPendingReports, getReportsByAgent, reviewReport, getApprovedOrphanIds };
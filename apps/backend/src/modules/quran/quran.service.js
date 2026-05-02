/**
 * quran.service.js
 */

const { query } = require('../../config/db');

const submitReport = async ({ orphanId, agentId, month, year, juzMemorized }) => {
  // Check no report already exists for this orphan/month/year
  const { rows: existing } = await query(
    'SELECT id FROM quran_reports WHERE orphan_id = $1 AND month = $2 AND year = $3',
    [orphanId, month, year]
  );
  if (existing.length > 0) {
    throw Object.assign(
      new Error(`تقرير الحفظ لهذا اليتيم عن شهر ${month}/${year} موجود بالفعل`),
      { status: 409 }
    );
  }

  const { rows: [report] } = await query(
    `INSERT INTO quran_reports
       (orphan_id, agent_id, month, year, juz_memorized)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orphanId, agentId, month, year, juzMemorized]
  );
  return report;
};

const getReports = async ({ agentId, status, month, year } = {}) => {
  const conditions = [];
  const params = [];

  if (agentId) {
    params.push(agentId);
    conditions.push(`qr.agent_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`qr.status = $${params.length}`);
  }
  if (month) {
    params.push(month);
    conditions.push(`qr.month = $${params.length}`);
  }
  if (year) {
    params.push(year);
    conditions.push(`qr.year = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(`
    SELECT
      qr.id, qr.month, qr.year, qr.juz_memorized,
      qr.status, qr.supervisor_notes, qr.submitted_at,
      o.full_name AS orphan_name,
      o.date_of_birth AS orphan_dob,
      g.name_ar AS governorate_ar,
      u.full_name AS agent_name
    FROM quran_reports qr
    JOIN orphans o ON o.id = qr.orphan_id
    LEFT JOIN governorates g ON g.id = o.governorate_id
    LEFT JOIN users u ON u.id = qr.agent_id
    ${where}
    ORDER BY qr.submitted_at DESC
  `, params);
  return rows;
};

const getReportById = async (id) => {
  const { rows: [report] } = await query(`
    SELECT qr.*, o.full_name AS orphan_name, o.date_of_birth AS orphan_dob,
           g.name_ar AS governorate_ar, u.full_name AS agent_name
    FROM quran_reports qr
    JOIN orphans o ON o.id = qr.orphan_id
    LEFT JOIN governorates g ON g.id = o.governorate_id
    LEFT JOIN users u ON u.id = qr.agent_id
    WHERE qr.id = $1
  `, [id]);
  return report || null;
};

const approveReport = async (id, supervisorId) => {
  const { rows: [report] } = await query(
    `UPDATE quran_reports SET status = 'approved'
     WHERE id = $1 AND status = 'pending' RETURNING *`,
    [id]
  );
  if (!report) throw Object.assign(new Error('التقرير غير موجود أو تمت مراجعته بالفعل'), { status: 400 });
  return report;
};

const rejectReport = async (id, notes) => {
  const { rows: [report] } = await query(
    `UPDATE quran_reports SET status = 'rejected', supervisor_notes = $1
     WHERE id = $2 AND status = 'pending' RETURNING *`,
    [notes || null, id]
  );
  if (!report) throw Object.assign(new Error('التقرير غير موجود أو تمت مراجعته بالفعل'), { status: 400 });
  return report;
};

module.exports = { submitReport, getReports, getReportById, approveReport, rejectReport };

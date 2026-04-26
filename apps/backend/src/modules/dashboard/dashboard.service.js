const { query } = require('../../config/db');

// ── GM Dashboard ───────────────────────────────────────────────────────────────

const getGmDashboard = async () => {
  const { rows: [totals] } = await query(`
    SELECT COUNT(*) AS total_orphans
    FROM orphans WHERE status != 'inactive'
  `);

  const { rows: orphansPerGov } = await query(`
    SELECT g.name_ar AS governorate_ar, g.name_en AS governorate_en,
           COUNT(o.id) AS count
    FROM orphans o
    JOIN governorates g ON g.id = o.governorate_id
    WHERE o.status != 'inactive'
    GROUP BY g.id, g.name_ar, g.name_en
    ORDER BY count DESC
  `);

  const { rows: orphansPerSponsor } = await query(`
    SELECT s.full_name AS sponsor_name, COUNT(sp.id) AS count
    FROM sponsorships sp
    JOIN sponsors s ON s.id = sp.sponsor_id
    WHERE sp.is_active = TRUE
    GROUP BY s.id, s.full_name
    ORDER BY count DESC
    LIMIT 10
  `);

  const { rows: latestOrphans } = await query(`
    SELECT o.id, o.full_name, o.status, o.is_gifted, o.created_at,
           g.name_ar AS governorate_ar
    FROM orphans o
    LEFT JOIN governorates g ON g.id = o.governorate_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  const { rows: [pending] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM orphans WHERE status = 'under_review')          AS registrations,
      (SELECT COUNT(*) FROM quran_reports WHERE status = 'pending')          AS quran_reports,
      (SELECT COUNT(*) FROM disbursement_lists
       WHERE status IN ('draft','supervisor_approved'))                       AS disbursements
  `);

  const { rows: [disbursement] } = await query(`
    SELECT
      COALESCE(SUM(di.amount), 0)                                                     AS total,
      COALESCE(SUM(di.amount) FILTER (WHERE dl.status = 'released'), 0)               AS released,
      COALESCE(SUM(di.amount) FILTER (WHERE dl.status != 'released'), 0)              AS pending
    FROM disbursement_items di
    JOIN disbursement_lists dl ON dl.id = di.list_id
    WHERE dl.month = EXTRACT(MONTH FROM NOW())
      AND dl.year  = EXTRACT(YEAR  FROM NOW())
      AND di.included = TRUE
  `);

  return {
    total_orphans: parseInt(totals.total_orphans),
    orphans_per_governorate: orphansPerGov.map(r => ({ ...r, count: parseInt(r.count) })),
    orphans_per_sponsor: orphansPerSponsor.map(r => ({ ...r, count: parseInt(r.count) })),
    latest_orphans: latestOrphans,
    pending_count: {
      registrations: parseInt(pending.registrations),
      quran_reports: parseInt(pending.quran_reports),
      disbursements: parseInt(pending.disbursements),
    },
    monthly_disbursement_summary: {
      total:    parseFloat(disbursement.total),
      released: parseFloat(disbursement.released),
      pending:  parseFloat(disbursement.pending),
    },
  };
};

// ── Agent Dashboard ────────────────────────────────────────────────────────────

const getAgentDashboard = async (agentId) => {
  const { rows: myOrphans } = await query(`
    SELECT o.id, o.full_name, o.status, o.is_gifted, o.date_of_birth, o.created_at,
           g.name_ar AS governorate_ar
    FROM orphans o
    LEFT JOIN governorates g ON g.id = o.governorate_id
    WHERE o.agent_id = $1
    ORDER BY o.created_at DESC
  `, [agentId]);

  const { rows: pendingReports } = await query(`
    SELECT o.id, o.full_name
    FROM orphans o
    WHERE o.agent_id = $1
      AND o.status = 'under_sponsorship'
      AND NOT EXISTS (
        SELECT 1 FROM quran_reports qr
        WHERE qr.orphan_id = o.id
          AND qr.month = EXTRACT(MONTH FROM NOW())
          AND qr.year  = EXTRACT(YEAR  FROM NOW())
      )
  `, [agentId]);

  return { my_orphans: myOrphans, pending_reports: pendingReports };
};

// ── Supervisor Dashboard ───────────────────────────────────────────────────────

const getSupervisorDashboard = async () => {
  // Pending registrations count
  const { rows: [regCount] } = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'under_review')   AS pending_registrations,
      COUNT(*) FILTER (WHERE TRUE)                       AS total
    FROM (
      SELECT status FROM orphans
      UNION ALL
      SELECT status FROM families
    ) combined
    WHERE status = 'under_review'
  `);

  // Simpler version — separate counts
  const { rows: [counts] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM orphans   WHERE status = 'under_review')   AS pending_orphans,
      (SELECT COUNT(*) FROM families  WHERE status = 'under_review')   AS pending_families,
      (SELECT COUNT(*) FROM quran_reports WHERE status = 'pending')     AS pending_quran_reports,
      (SELECT COUNT(*) FROM disbursement_lists
       WHERE status IN ('draft', 'supervisor_approved'))                AS pending_disbursements
  `);

  // Latest pending registrations — orphans
  const { rows: pendingOrphans } = await query(`
    SELECT o.id, o.full_name AS name, 'orphan' AS record_type,
           o.status, o.created_at,
           g.name_ar AS governorate_ar,
           u.full_name AS agent_name
    FROM orphans o
    LEFT JOIN governorates g ON g.id = o.governorate_id
    LEFT JOIN users u ON u.id = o.agent_id
    WHERE o.status = 'under_review'
    ORDER BY o.created_at ASC
    LIMIT 5
  `);

  // Latest pending registrations — families
  const { rows: pendingFamilies } = await query(`
    SELECT f.id, f.family_name AS name, 'family' AS record_type,
           f.status, f.created_at,
           g.name_ar AS governorate_ar,
           u.full_name AS agent_name
    FROM families f
    LEFT JOIN governorates g ON g.id = f.governorate_id
    LEFT JOIN users u ON u.id = f.agent_id
    WHERE f.status = 'under_review'
    ORDER BY f.created_at ASC
    LIMIT 5
  `);

  // Recent quran reports pending review
  const { rows: pendingQuranReports } = await query(`
    SELECT qr.id, o.full_name AS orphan_name,
           qr.month, qr.year, qr.juz_memorized, qr.submitted_at,
           u.full_name AS agent_name
    FROM quran_reports qr
    JOIN orphans o ON o.id = qr.orphan_id
    JOIN users u ON u.id = qr.agent_id
    WHERE qr.status = 'pending'
    ORDER BY qr.submitted_at ASC
    LIMIT 5
  `);

  // Next disbursement date (28th of current month)
  const now = new Date();
  const disbursementDay = 28;
  const nextDisbursement = new Date(now.getFullYear(), now.getMonth(), disbursementDay);
  if (now.getDate() > disbursementDay) {
    nextDisbursement.setMonth(nextDisbursement.getMonth() + 1);
  }

  return {
    pending_counts: {
      orphans:          parseInt(counts.pending_orphans),
      families:         parseInt(counts.pending_families),
      quran_reports:    parseInt(counts.pending_quran_reports),
      disbursements:    parseInt(counts.pending_disbursements),
      total_registrations: parseInt(counts.pending_orphans) + parseInt(counts.pending_families),
    },
    pending_orphans:       pendingOrphans,
    pending_families:      pendingFamilies,
    pending_quran_reports: pendingQuranReports,
    next_disbursement_date: nextDisbursement.toISOString(),
  };
};

module.exports = { getGmDashboard, getAgentDashboard, getSupervisorDashboard };

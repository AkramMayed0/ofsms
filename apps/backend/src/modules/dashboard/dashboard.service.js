const { query } = require('../../config/db');

const getGmDashboard = async () => {
  // 1. Total orphans + gifted count
  const { rows: [totals] } = await query(`
    SELECT
      COUNT(*)                              AS total_orphans,
      COUNT(*) FILTER (WHERE is_gifted)    AS gifted_count
    FROM orphans
    WHERE status != 'inactive'
  `);

  // 2. Orphans per governorate
  const { rows: orphansPerGov } = await query(`
    SELECT g.name_ar AS governorate_ar, g.name_en AS governorate_en,
           COUNT(o.id) AS count
    FROM orphans o
    JOIN governorates g ON g.id = o.governorate_id
    WHERE o.status != 'inactive'
    GROUP BY g.id, g.name_ar, g.name_en
    ORDER BY count DESC
  `);

  // 3. Orphans per sponsor (top 10)
  const { rows: orphansPerSponsor } = await query(`
    SELECT s.full_name AS sponsor_name,
           COUNT(sp.id) AS count
    FROM sponsorships sp
    JOIN sponsors s ON s.id = sp.sponsor_id
    WHERE sp.is_active = TRUE
    GROUP BY s.id, s.full_name
    ORDER BY count DESC
    LIMIT 10
  `);

  // 4. Latest 10 orphans added
  const { rows: latestOrphans } = await query(`
    SELECT o.id, o.full_name, o.status, o.is_gifted, o.created_at,
           g.name_ar AS governorate_ar
    FROM orphans o
    LEFT JOIN governorates g ON g.id = o.governorate_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  // 5. Pending counts
  const { rows: [pending] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM orphans WHERE status = 'under_review')                           AS registrations,
      (SELECT COUNT(*) FROM quran_reports WHERE status = 'pending')                          AS quran_reports,
      (SELECT COUNT(*) FROM disbursement_lists WHERE status IN ('draft','supervisor_approved')) AS disbursements
  `);

  // 6. Monthly disbursement summary (current month)
  const { rows: [disbursement] } = await query(`
    SELECT
      COALESCE(SUM(di.amount), 0)                                                    AS total,
      COALESCE(SUM(di.amount) FILTER (WHERE dl.status = 'released'), 0)              AS released,
      COALESCE(SUM(di.amount) FILTER (WHERE dl.status != 'released'), 0)             AS pending
    FROM disbursement_items di
    JOIN disbursement_lists dl ON dl.id = di.list_id
    WHERE dl.month = EXTRACT(MONTH FROM NOW())
      AND dl.year  = EXTRACT(YEAR  FROM NOW())
      AND di.included = TRUE
  `);

  return {
    total_orphans:   parseInt(totals.total_orphans),
    gifted_count:    parseInt(totals.gifted_count),
    orphans_per_governorate: orphansPerGov.map(r => ({ ...r, count: parseInt(r.count) })),
    orphans_per_sponsor:     orphansPerSponsor.map(r => ({ ...r, count: parseInt(r.count) })),
    latest_orphans:  latestOrphans,
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

const getAgentDashboard = async (agentId) => {
  const { rows: myOrphans } = await query(`
    SELECT o.id, o.full_name, o.status, o.is_gifted, o.created_at,
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

  return {
    my_orphans:      myOrphans,
    pending_reports: pendingReports,
  };
};

module.exports = { getGmDashboard, getAgentDashboard };
const getSupervisorDashboard = async () => {
  // 1. Pending registrations (orphans + families awaiting review)
  const { rows: [regCounts] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM orphans  WHERE status = 'under_review') AS pending_orphans,
      (SELECT COUNT(*) FROM families WHERE status = 'under_review') AS pending_families
  `);

  // 2. Pending Quran reports (submitted by agents, awaiting supervisor review)
  const { rows: [{ pending_quran_reports }] } = await query(`
    SELECT COUNT(*) AS pending_quran_reports
    FROM quran_reports
    WHERE status = 'pending'
  `);

  // 3. Active disbursement list status (is there one in progress this month?)
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const { rows: [currentList] } = await query(`
    SELECT id, status, month, year,
           supervisor_approved_at, finance_approved_at, gm_approved_at
    FROM disbursement_lists
    WHERE month = $1 AND year = $2
    LIMIT 1
  `, [month, year]);

  // 4. Next disbursement date: always the 28th of the current month
  const nextDisbursementDate = new Date(year, month - 1, 28);
  // If we're past the 28th, point to next month's 28th
  if (now.getDate() > 28) {
    nextDisbursementDate.setMonth(nextDisbursementDate.getMonth() + 1);
  }

  // 5. Upcoming actions — what does the supervisor need to do right now?
  const upcomingActions = [];

  const pendingRegistrationsTotal =
    parseInt(regCounts.pending_orphans) + parseInt(regCounts.pending_families);

  if (pendingRegistrationsTotal > 0) {
    upcomingActions.push({
      type:    'pending_registrations',
      label:   `مراجعة ${pendingRegistrationsTotal} طلب تسجيل معلّق`,
      count:   pendingRegistrationsTotal,
      link:    '/registrations',
    });
  }

  if (parseInt(pending_quran_reports) > 0) {
    upcomingActions.push({
      type:  'pending_quran_reports',
      label: `مراجعة ${pending_quran_reports} تقرير حفظ معلّق`,
      count: parseInt(pending_quran_reports),
      link:  '/quran-reports',
    });
  }

  if (currentList && currentList.status === 'draft') {
    upcomingActions.push({
      type:  'approve_disbursement',
      label: `اعتماد كشف الصرف لشهر ${currentList.month}/${currentList.year}`,
      count: 1,
      link:  `/disbursements/${currentList.id}`,
    });
  }

  return {
    pending_registrations_count: pendingRegistrationsTotal,
    pending_orphans_count:       parseInt(regCounts.pending_orphans),
    pending_families_count:      parseInt(regCounts.pending_families),
    pending_quran_reports_count: parseInt(pending_quran_reports),
    current_disbursement_list:   currentList || null,
    next_disbursement_date:      nextDisbursementDate.toISOString().split('T')[0],
    upcoming_actions:            upcomingActions,
  };
};

module.exports = { getGmDashboard, getAgentDashboard, getSupervisorDashboard };

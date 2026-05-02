/**
 * disbursements.service.js
 */

const { query } = require('../../config/db');

// ── List all disbursement lists ────────────────────────────────────────────────
const getDisbursementLists = async () => {
  const { rows } = await query(`
    SELECT
      dl.id, dl.month, dl.year, dl.status,
      dl.created_at,
      dl.supervisor_approved_at,
      dl.finance_approved_at,
      dl.gm_approved_at,
      dl.rejection_notes,
      u_created.full_name  AS created_by_name,
      u_sup.full_name      AS supervisor_name,
      u_fin.full_name      AS finance_name,
      u_gm.full_name       AS gm_name,
      COUNT(di.id) FILTER (WHERE di.included = TRUE)   AS included_count,
      COUNT(di.id) FILTER (WHERE di.included = FALSE)  AS excluded_count,
      COALESCE(SUM(di.amount) FILTER (WHERE di.included = TRUE), 0) AS total_amount
    FROM disbursement_lists dl
    LEFT JOIN users u_created ON u_created.id = dl.created_by
    LEFT JOIN users u_sup     ON u_sup.id     = dl.approved_by_supervisor
    LEFT JOIN users u_fin     ON u_fin.id     = dl.approved_by_finance
    LEFT JOIN users u_gm      ON u_gm.id      = dl.approved_by_gm
    LEFT JOIN disbursement_items di ON di.list_id = dl.id
    GROUP BY dl.id, u_created.full_name, u_sup.full_name, u_fin.full_name, u_gm.full_name
    ORDER BY dl.year DESC, dl.month DESC
  `);
  return rows;
};

// ── Get single list with all items ────────────────────────────────────────────
const getDisbursementById = async (id) => {
  const { rows: [list] } = await query(`
    SELECT
      dl.*,
      u_created.full_name AS created_by_name,
      u_sup.full_name     AS supervisor_name,
      u_fin.full_name     AS finance_name,
      u_gm.full_name      AS gm_name
    FROM disbursement_lists dl
    LEFT JOIN users u_created ON u_created.id = dl.created_by
    LEFT JOIN users u_sup     ON u_sup.id     = dl.approved_by_supervisor
    LEFT JOIN users u_fin     ON u_fin.id     = dl.approved_by_finance
    LEFT JOIN users u_gm      ON u_gm.id      = dl.approved_by_gm
    WHERE dl.id = $1
  `, [id]);

  if (!list) return null;

  // Get items — orphans
  const { rows: orphanItems } = await query(`
    SELECT
      di.id, di.amount, di.included, di.exclusion_reason,
      'orphan' AS beneficiary_type,
      o.full_name AS beneficiary_name,
      g.name_ar   AS governorate_ar,
      s.full_name AS sponsor_name,
      sp.monthly_amount,
      u.full_name AS agent_name,
      br.confirmed_at AS biometric_confirmed_at
    FROM disbursement_items di
    JOIN orphans o ON o.id = di.orphan_id
    LEFT JOIN governorates g ON g.id = o.governorate_id
    LEFT JOIN sponsorships sp ON sp.beneficiary_id = o.id
      AND sp.beneficiary_type = 'orphan' AND sp.is_active = TRUE
    LEFT JOIN sponsors s ON s.id = sp.sponsor_id
    LEFT JOIN users u ON u.id = sp.agent_id
    LEFT JOIN biometric_receipts br ON br.item_id = di.id
    WHERE di.list_id = $1 AND di.orphan_id IS NOT NULL
    ORDER BY di.included DESC, o.full_name ASC
  `, [id]);

  // Get items — families
  const { rows: familyItems } = await query(`
    SELECT
      di.id, di.amount, di.included, di.exclusion_reason,
      'family' AS beneficiary_type,
      f.family_name AS beneficiary_name,
      g.name_ar     AS governorate_ar,
      s.full_name   AS sponsor_name,
      sp.monthly_amount,
      u.full_name   AS agent_name,
      br.confirmed_at AS biometric_confirmed_at
    FROM disbursement_items di
    JOIN families f ON f.id = di.family_id
    LEFT JOIN governorates g ON g.id = f.governorate_id
    LEFT JOIN sponsorships sp ON sp.beneficiary_id = f.id
      AND sp.beneficiary_type = 'family' AND sp.is_active = TRUE
    LEFT JOIN sponsors s ON s.id = sp.sponsor_id
    LEFT JOIN users u ON u.id = sp.agent_id
    LEFT JOIN biometric_receipts br ON br.item_id = di.id
    WHERE di.list_id = $1 AND di.family_id IS NOT NULL
    ORDER BY di.included DESC, f.family_name ASC
  `, [id]);

  const items = [...orphanItems, ...familyItems].sort((a, b) =>
    b.included - a.included || a.beneficiary_name.localeCompare(b.beneficiary_name, 'ar')
  );

  return { ...list, items };
};

// ── Generate monthly disbursement list ────────────────────────────────────────
const generateDisbursementList = async (createdBy) => {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // Check if list already exists for this month
  const { rows: existing } = await query(
    'SELECT id FROM disbursement_lists WHERE month = $1 AND year = $2',
    [month, year]
  );
  if (existing.length > 0) {
    throw Object.assign(new Error('كشف الصرف لهذا الشهر موجود بالفعل'), { status: 409 });
  }

  // Create the list
  const { rows: [list] } = await query(
    `INSERT INTO disbursement_lists (month, year, created_by)
     VALUES ($1, $2, $3) RETURNING *`,
    [month, year, createdBy]
  );

  // Get all active orphan sponsorships with approved quran reports this month
  const { rows: orphanRows } = await query(`
    SELECT sp.beneficiary_id AS orphan_id, sp.monthly_amount,
           qr.status AS quran_status
    FROM sponsorships sp
    LEFT JOIN quran_reports qr ON qr.orphan_id = sp.beneficiary_id
      AND qr.month = $1 AND qr.year = $2
    WHERE sp.beneficiary_type = 'orphan' AND sp.is_active = TRUE
  `, [month, year]);

  // Get all active family sponsorships
  const { rows: familyRows } = await query(`
    SELECT sp.beneficiary_id AS family_id, sp.monthly_amount
    FROM sponsorships sp
    WHERE sp.beneficiary_type = 'family' AND sp.is_active = TRUE
  `);

  // Insert items
  for (const o of orphanRows) {
    const included = !o.quran_status || o.quran_status === 'approved';
    const reason   = o.quran_status === 'rejected'
      ? 'لم يستوفِ حصة الحفظ الشهرية'
      : o.quran_status === 'pending'
      ? 'تقرير الحفظ قيد المراجعة'
      : null;

    await query(
      `INSERT INTO disbursement_items (list_id, orphan_id, amount, included, exclusion_reason)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [list.id, o.orphan_id, o.monthly_amount, included, reason]
    );
  }

  for (const f of familyRows) {
    await query(
      `INSERT INTO disbursement_items (list_id, family_id, amount, included)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [list.id, f.family_id, f.monthly_amount]
    );
  }

  return getDisbursementById(list.id);
};

// ── Supervisor approve ────────────────────────────────────────────────────────
const supervisorApprove = async (id, supervisorId) => {
  const { rows: [list] } = await query(
    `UPDATE disbursement_lists
     SET status = 'supervisor_approved',
         approved_by_supervisor = $1,
         supervisor_approved_at = NOW()
     WHERE id = $2 AND status = 'draft'
     RETURNING *`,
    [supervisorId, id]
  );
  if (!list) throw Object.assign(new Error('الكشف غير موجود أو لا يمكن اعتماده بهذه الحالة'), { status: 400 });
  return list;
};

// ── Supervisor reject ─────────────────────────────────────────────────────────
const supervisorReject = async (id, supervisorId, notes) => {
  const { rows: [list] } = await query(
    `UPDATE disbursement_lists
     SET status = 'rejected', rejection_notes = $1
     WHERE id = $2 AND status = 'draft'
     RETURNING *`,
    [notes, id]
  );
  if (!list) throw Object.assign(new Error('الكشف غير موجود أو لا يمكن رفضه'), { status: 400 });
  return list;
};

// ── Finance approve ───────────────────────────────────────────────────────────
const financeApprove = async (id, financeId) => {
  const { rows: [list] } = await query(
    `UPDATE disbursement_lists
     SET status = 'finance_approved',
         approved_by_finance = $1,
         finance_approved_at = NOW()
     WHERE id = $2 AND status = 'supervisor_approved'
     RETURNING *`,
    [financeId, id]
  );
  if (!list) throw Object.assign(new Error('الكشف غير موجود أو لا يمكن اعتماده'), { status: 400 });
  return list;
};

// ── Finance reject ────────────────────────────────────────────────────────────
const financeReject = async (id, financeId, notes) => {
  const { rows: [list] } = await query(
    `UPDATE disbursement_lists
     SET status = 'draft', rejection_notes = $1
     WHERE id = $2 AND status = 'supervisor_approved'
     RETURNING *`,
    [notes, id]
  );
  if (!list) throw Object.assign(new Error('الكشف غير موجود أو لا يمكن رفضه'), { status: 400 });
  return list;
};

// ── GM release ────────────────────────────────────────────────────────────────
const gmRelease = async (id, gmId) => {
  const { rows: [list] } = await query(
    `UPDATE disbursement_lists
     SET status = 'released',
         approved_by_gm = $1,
         gm_approved_at = NOW()
     WHERE id = $2 AND status = 'finance_approved'
     RETURNING *`,
    [gmId, id]
  );
  if (!list) throw Object.assign(new Error('الكشف غير موجود أو لا يمكن إصداره'), { status: 400 });
  return list;
};

module.exports = {
  getDisbursementLists,
  getDisbursementById,
  generateDisbursementList,
  supervisorApprove,
  supervisorReject,
  financeApprove,
  financeReject,
  gmRelease,
};

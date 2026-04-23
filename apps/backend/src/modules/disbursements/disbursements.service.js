/**
 * disbursements.service.js
 * Database queries for the disbursements module.
 */

const { query } = require('../../config/db');

/**
 * Generate a disbursement list for the current month.
 * - Creates one DisbursementList row (draft status)
 * - Inserts one DisbursementItem per active sponsored orphan/family
 * - Skips beneficiaries with no active sponsorship (no amount to disburse)
 *
 * @param {string} createdBy - UUID of the user triggering generation (GM/supervisor)
 * @returns {{ list, items }}
 */
const generateDisbursementList = async (createdBy) => {
  const now   = new Date();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  const year  = now.getFullYear();

  // Create the DisbursementList — DB unique constraint handles duplicates
  const { rows: listRows } = await query(
    `INSERT INTO disbursement_lists (month, year, status, created_by)
     VALUES ($1, $2, 'draft', $3)
     RETURNING *`,
    [month, year, createdBy]
  );
  const list = listRows[0];

  // Pull all active orphan sponsorships
  const { rows: orphanSponsorships } = await query(
    `SELECT
       sp.beneficiary_id AS orphan_id,
       sp.monthly_amount,
       o.full_name,
       o.agent_id,
       s.full_name      AS sponsor_name,
       g.name_ar        AS governorate_ar
     FROM sponsorships sp
     JOIN orphans      o ON o.id = sp.beneficiary_id
     JOIN sponsors     s ON s.id = sp.sponsor_id
     JOIN governorates g ON g.id = o.governorate_id
     WHERE sp.beneficiary_type = 'orphan'
       AND sp.is_active         = TRUE
       AND o.status             = 'under_sponsorship'`
  );

  // Pull all active family sponsorships
  const { rows: familySponsorships } = await query(
    `SELECT
       sp.beneficiary_id AS family_id,
       sp.monthly_amount,
       f.family_name     AS full_name,
       f.agent_id,
       s.full_name       AS sponsor_name,
       g.name_ar         AS governorate_ar
     FROM sponsorships sp
     JOIN families     f ON f.id = sp.beneficiary_id
     JOIN sponsors     s ON s.id = sp.sponsor_id
     JOIN governorates g ON g.id = f.governorate_id
     WHERE sp.beneficiary_type = 'family'
       AND sp.is_active         = TRUE
       AND f.status             = 'under_sponsorship'`
  );

  // Bulk insert DisbursementItems for orphans
  const insertedItems = [];

  for (const o of orphanSponsorships) {
    const { rows } = await query(
      `INSERT INTO disbursement_items
         (list_id, orphan_id, family_id, amount, included)
       VALUES ($1, $2, NULL, $3, TRUE)
       RETURNING *`,
      [list.id, o.orphan_id, o.monthly_amount]
    );
    insertedItems.push({ ...rows[0], full_name: o.full_name, sponsor_name: o.sponsor_name, governorate_ar: o.governorate_ar });
  }

  // Bulk insert DisbursementItems for families
  for (const f of familySponsorships) {
    const { rows } = await query(
      `INSERT INTO disbursement_items
         (list_id, orphan_id, family_id, amount, included)
       VALUES ($1, NULL, $2, $3, TRUE)
       RETURNING *`,
      [list.id, f.family_id, f.monthly_amount]
    );
    insertedItems.push({ ...rows[0], full_name: f.full_name, sponsor_name: f.sponsor_name, governorate_ar: f.governorate_ar });
  }

  return { list, items: insertedItems };
};

/**
 * Get a disbursement list by ID with all its items.
 */
const getDisbursementListById = async (id) => {
  const { rows: listRows } = await query(
    `SELECT
       dl.*,
       u.full_name AS created_by_name
     FROM disbursement_lists dl
     LEFT JOIN users u ON u.id = dl.created_by
     WHERE dl.id = $1`,
    [id]
  );

  if (!listRows[0]) return null;

  const { rows: items } = await query(
    `SELECT
       di.id, di.amount, di.included, di.exclusion_reason,
       di.orphan_id, di.family_id,
       COALESCE(o.full_name, f.family_name)  AS beneficiary_name,
       COALESCE(go.name_ar, gf.name_ar)      AS governorate_ar,
       COALESCE(uo.full_name, uf.full_name)  AS agent_name,
       so.full_name                          AS sponsor_name
     FROM disbursement_items di
     LEFT JOIN orphans      o  ON o.id  = di.orphan_id
     LEFT JOIN families     f  ON f.id  = di.family_id
     LEFT JOIN governorates go ON go.id = o.governorate_id
     LEFT JOIN governorates gf ON gf.id = f.governorate_id
     LEFT JOIN users        uo ON uo.id = o.agent_id
     LEFT JOIN users        uf ON uf.id = f.agent_id
     LEFT JOIN sponsorships sp ON sp.beneficiary_id = COALESCE(di.orphan_id, di.family_id)
                               AND sp.is_active = TRUE
     LEFT JOIN sponsors     so ON so.id = sp.sponsor_id
     WHERE di.list_id = $1
     ORDER BY di.created_at ASC`,
    [id]
  );

  return { list: listRows[0], items };
};

/**
 * Get all disbursement lists (paginated, latest first).
 */
const getAllDisbursementLists = async () => {
  const { rows } = await query(
    `SELECT
       dl.*,
       u.full_name AS created_by_name,
       COUNT(di.id) AS total_items,
       SUM(di.amount) FILTER (WHERE di.included = TRUE) AS total_amount
     FROM disbursement_lists dl
     LEFT JOIN users u ON u.id = dl.created_by
     LEFT JOIN disbursement_items di ON di.list_id = dl.id
     GROUP BY dl.id, u.full_name
     ORDER BY dl.year DESC, dl.month DESC`
  );
  return rows;
};

// apps/backend/src/modules/disbursements/disbursements.service.js
// ADD these two functions at the bottom (before module.exports)

/**
 * Supervisor approves a disbursement list.
 * Status transition: draft → supervisor_approved
 * Notifies all Finance users that a list is ready for their review.
 */
const supervisorApproveDisbursement = async (listId, supervisorId) => {
  const { rows } = await query(
    `UPDATE disbursement_lists
     SET
       status                   = 'supervisor_approved',
       approved_by_supervisor   = $1,
       supervisor_approved_at   = NOW()
     WHERE id = $2
       AND status = 'draft'
     RETURNING *`,
    [supervisorId, listId]
  );

  if (!rows[0]) return null; // not found or wrong status

  const list = rows[0];

  // Notify all active Finance users (FR-024)
  const { rows: financeUsers } = await query(
    `SELECT id FROM users WHERE role = 'finance' AND is_active = TRUE`
  );
  const { sendBulkNotification } = require('../notifications/notifications.service');
  if (financeUsers.length > 0) {
    await sendBulkNotification(
      financeUsers.map((u) => u.id),
      'كشف الصرف بانتظار مصادقتك',
      `تمت الموافقة على كشف الصرف لشهر ${list.month}/${list.year} من قِبَل المشرف. يرجى المراجعة والمصادقة.`,
      { listId, action: 'disbursement_supervisor_approved' },
      'disbursement_approved'
    );
  }

  // Also notify GM (FR-047 — GM receives all system notifications)
  const { rows: gmUsers } = await query(
    `SELECT id FROM users WHERE role = 'gm' AND is_active = TRUE`
  );
  if (gmUsers.length > 0) {
    await sendBulkNotification(
      gmUsers.map((u) => u.id),
      'كشف الصرف وصل للمالي',
      `كشف الصرف لشهر ${list.month}/${list.year} اعتمده المشرف وأُرسل للقسم المالي.`,
      { listId, action: 'disbursement_supervisor_approved' },
      'disbursement_approved'
    );
  }

  return list;
};

/**
 * Supervisor rejects a disbursement list (sends it back for correction).
 * Status transition: draft → rejected
 * Notifies the list creator.
 */
const supervisorRejectDisbursement = async (listId, supervisorId, notes) => {
  const { rows } = await query(
    `UPDATE disbursement_lists
     SET
       status           = 'rejected',
       rejection_notes  = $1,
       updated_at       = NOW()
     WHERE id = $2
       AND status = 'draft'
     RETURNING *`,
    [notes, listId]
  );

  if (!rows[0]) return null;

  const list = rows[0];

  // Notify the creator
  if (list.created_by) {
    const { sendPushNotification } = require('../notifications/notifications.service');
    await sendPushNotification(
      list.created_by,
      'تم رفض كشف الصرف',
      `تم رفض كشف الصرف لشهر ${list.month}/${list.year}. السبب: ${notes}`,
      { listId, action: 'disbursement_rejected' },
      'disbursement_rejected',
      listId
    );
  }

  return list;
};

/**
 * Finance approves a disbursement list.
 * Status: supervisor_approved → finance_approved
 * Notifies all GM users (FR-026, FR-047).
 */
const financeApproveDisbursement = async (listId, financeUserId) => {
  const { rows } = await query(
    `UPDATE disbursement_lists
     SET status               = 'finance_approved',
         approved_by_finance  = $1,
         finance_approved_at  = NOW()
     WHERE id = $2 AND status = 'supervisor_approved'
     RETURNING *`,
    [financeUserId, listId]
  );

  if (!rows[0]) return null;
  const list = rows[0];

  const { sendBulkNotification } = require('../notifications/notifications.service');

  // Notify GM (FR-026, FR-047)
  const { rows: gmUsers } = await query(
    `SELECT id FROM users WHERE role = 'gm' AND is_active = TRUE`
  );
  if (gmUsers.length > 0) {
    await sendBulkNotification(
      gmUsers.map((u) => u.id),
      'كشف الصرف بانتظار إقرارك النهائي',
      `صادق القسم المالي على كشف الصرف لشهر ${list.month}/${list.year}. يرجى مراجعته وإصدار الأمر النهائي.`,
      { listId, action: 'disbursement_finance_approved' },
      'disbursement_approved'
    );
  }

  return list;
};

/**
 * Finance rejects a disbursement list (sends it back to supervisor).
 * Status: supervisor_approved → rejected
 * Notes are required. Notifies all active supervisors.
 */
const financeRejectDisbursement = async (listId, financeUserId, notes) => {
  const { rows } = await query(
    `UPDATE disbursement_lists
     SET status          = 'rejected',
         rejection_notes = $1,
         updated_at      = NOW()
     WHERE id = $2 AND status = 'supervisor_approved'
     RETURNING *`,
    [notes, listId]
  );

  if (!rows[0]) return null;
  const list = rows[0];

  const { sendBulkNotification } = require('../notifications/notifications.service');

  // Notify all active supervisors
  const { rows: supervisors } = await query(
    `SELECT id FROM users WHERE role = 'supervisor' AND is_active = TRUE`
  );
  if (supervisors.length > 0) {
    await sendBulkNotification(
      supervisors.map((u) => u.id),
      'تم رفض كشف الصرف من القسم المالي',
      `رفض القسم المالي كشف الصرف لشهر ${list.month}/${list.year}. السبب: ${notes}`,
      { listId, action: 'disbursement_finance_rejected' },
      'disbursement_rejected'
    );
  }

  // Also notify GM (FR-047)
  const { rows: gmUsers } = await query(
    `SELECT id FROM users WHERE role = 'gm' AND is_active = TRUE`
  );
  if (gmUsers.length > 0) {
    await sendBulkNotification(
      gmUsers.map((u) => u.id),
      'رفض المالي لكشف الصرف',
      `رفض القسم المالي كشف الصرف لشهر ${list.month}/${list.year}. السبب: ${notes}`,
      { listId, action: 'disbursement_finance_rejected' },
      'disbursement_rejected'
    );
  }

  return list;
};

/**
 * GM releases a disbursement list.
 * Status: finance_approved → released
 * Logs a disbursement assignment per item (agent gets funds to distribute).
 * Notifies all involved agents + GM (FR-027, FR-047).
 */
const gmReleaseDisbursement = async (listId, gmUserId) => {
  const { rows } = await query(
    `UPDATE disbursement_lists
     SET status           = 'released',
         approved_by_gm   = $1,
         gm_approved_at   = NOW()
     WHERE id = $2 AND status = 'finance_approved'
     RETURNING *`,
    [gmUserId, listId]
  );

  if (!rows[0]) return null;
  const list = rows[0];

  // Fetch all included items with agent info for logging + notification
  const { rows: items } = await query(
    `SELECT
       di.id AS item_id,
       di.amount,
       di.orphan_id,
       di.family_id,
       COALESCE(o.agent_id, f.agent_id) AS agent_id,
       COALESCE(o.full_name, f.family_name) AS beneficiary_name
     FROM disbursement_items di
     LEFT JOIN orphans   o ON o.id = di.orphan_id
     LEFT JOIN families  f ON f.id = di.family_id
     WHERE di.list_id = $1 AND di.included = TRUE`,
    [listId]
  );

  // Log one audit entry per item (FR-027 — funds assigned to agent)
  for (const item of items) {
    await query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'disbursement_released', 'disbursement_item', $2, $3)`,
      [
        gmUserId,
        item.item_id,
        JSON.stringify({
          list_id:          listId,
          agent_id:         item.agent_id,
          beneficiary_name: item.beneficiary_name,
          amount:           item.amount,
          month:            list.month,
          year:             list.year,
        }),
      ]
    );
  }

  // Collect unique agent IDs
  const agentIds = [...new Set(items.map((i) => i.agent_id).filter(Boolean))];

  const { sendBulkNotification } = require('../notifications/notifications.service');

  // Notify agents (FR-027)
  if (agentIds.length > 0) {
    await sendBulkNotification(
      agentIds,
      'تم إصدار أمر الصرف',
      `تم إقرار صرف كشف شهر ${list.month}/${list.year} من قِبَل المدير العام. يرجى توزيع المبالغ على الأيتام والأسر وتسجيل تأكيدات الاستلام.`,
      { listId, action: 'disbursement_released' },
      'disbursement_approved'
    );
  }

  // Notify GM themselves as a record (FR-047)
  const { rows: gmUsers } = await query(
    `SELECT id FROM users WHERE role = 'gm' AND is_active = TRUE`
  );
  if (gmUsers.length > 0) {
    await sendBulkNotification(
      gmUsers.map((u) => u.id),
      'تم إصدار كشف الصرف',
      `تم إصدار كشف الصرف لشهر ${list.month}/${list.year} بنجاح. ${agentIds.length} مندوب سيتلقى إشعاراً بالتوزيع.`,
      { listId, action: 'disbursement_released' },
      'disbursement_approved'
    );
  }

  return { list, released_items: items.length, notified_agents: agentIds.length };
};

module.exports = {
  generateDisbursementList,
  getDisbursementListById,
  getAllDisbursementLists,
  supervisorApproveDisbursement,
  supervisorRejectDisbursement,
  financeApproveDisbursement,
  financeRejectDisbursement,
  gmReleaseDisbursement,    
};
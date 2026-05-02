/**
 * receipts.service.js
 * DB queries for the biometric receipts module.
 * Covers FR-029, FR-030, FR-031, FR-032.
 */

const { query } = require('../../config/db');
const { uploadFile } = require('../../config/s3');
const { logAudit } = require('../../utils/auditLog');

/**
 * Upload a base64 fingerprint image to S3 and create a BiometricReceipt record.
 *
 * @param {Object} params
 * @param {string} params.itemId              - UUID of the disbursement_item being confirmed
 * @param {string} params.agentId             - UUID of the agent uploading
 * @param {string} params.fingerprintBase64   - Base64-encoded image string (no data URI prefix)
 * @param {string} [params.mimeType]          - e.g. 'image/png' (default)
 * @returns {Promise<Object>} the inserted biometric_receipt row
 */
const uploadBiometricReceipt = async ({
  itemId,
  agentId,
  fingerprintBase64,
  mimeType = 'image/png',
}) => {
  // 1. Verify the disbursement item exists and belongs to an active released list
  const { rows: itemRows } = await query(
    `SELECT di.id, di.orphan_id, di.family_id, di.included, dl.status AS list_status
     FROM disbursement_items di
     JOIN disbursement_lists dl ON dl.id = di.list_id
     WHERE di.id = $1`,
    [itemId]
  );

  const item = itemRows[0];
  if (!item) {
    throw Object.assign(new Error('بند الصرف غير موجود'), { status: 404 });
  }
  if (!item.included) {
    throw Object.assign(new Error('هذا المستفيد مستبعد من الصرف الحالي'), { status: 400 });
  }
  if (item.list_status !== 'released') {
    throw Object.assign(
      new Error('لا يمكن تسجيل استلام بصمة لكشف لم يُصدر بعد'),
      { status: 400 }
    );
  }

  // 2. Check: no duplicate receipt for this item
  const { rows: existing } = await query(
    'SELECT id FROM biometric_receipts WHERE item_id = $1',
    [itemId]
  );
  if (existing.length > 0) {
    throw Object.assign(
      new Error('تم تسجيل بصمة الاستلام لهذا المستفيد مسبقاً'),
      { status: 409 }
    );
  }

  // 3. Decode base64 → Buffer and upload to S3
  const buffer = Buffer.from(fingerprintBase64, 'base64');
  const ext = mimeType === 'image/jpeg' ? '.jpg' : '.png';

  const { key } = await uploadFile({
    buffer,
    originalName: `fingerprint${ext}`,
    mimetype: mimeType,
    folder: 'biometrics',
  });

  // 4. Insert receipt record
  const { rows } = await query(
    `INSERT INTO biometric_receipts (item_id, agent_id, fingerprint_key)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [itemId, agentId, key]
  );
  const receipt = rows[0];

  // 5. Audit log
  await logAudit({
    userId:     agentId,
    action:     'biometric_receipt_uploaded',
    entityType: 'biometric_receipt',
    entityId:   receipt.id,
    newValue:   { item_id: itemId, fingerprint_key: key },
  });

  return receipt;
};

/**
 * Get all biometric receipts — filterable by agent_id or list_id.
 * Used by supervisor/GM (FR-032).
 *
 * @param {Object} filters
 * @param {string} [filters.agentId]
 * @param {string} [filters.listId]
 * @returns {Promise<Array>}
 */
const getReceipts = async ({ agentId, listId } = {}) => {
  const conditions = [];
  const params = [];

  if (agentId) {
    params.push(agentId);
    conditions.push(`br.agent_id = $${params.length}`);
  }
  if (listId) {
    params.push(listId);
    conditions.push(`di.list_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT
       br.id,
       br.item_id,
       br.agent_id,
       br.fingerprint_key,
       br.confirmed_at,
       u.full_name         AS agent_name,
       di.amount,
       di.list_id,
       dl.month,
       dl.year,
       COALESCE(o.full_name, f.family_name) AS beneficiary_name,
       CASE WHEN di.orphan_id IS NOT NULL THEN 'orphan' ELSE 'family' END AS beneficiary_type
     FROM biometric_receipts br
     JOIN disbursement_items di ON di.id  = br.item_id
     JOIN disbursement_lists dl ON dl.id  = di.list_id
     JOIN users u               ON u.id   = br.agent_id
     LEFT JOIN orphans   o ON o.id = di.orphan_id
     LEFT JOIN families  f ON f.id = di.family_id
     ${where}
     ORDER BY br.confirmed_at DESC`,
    params
  );

  return rows;
};

/**
 * Get receipt completion summary for an agent's batch in a given disbursement list.
 * Used by agent to confirm they've uploaded all receipts (FR-031).
 */
const getAgentReceiptSummary = async (agentId, listId) => {
  const { rows } = await query(
    `SELECT
       COUNT(di.id)                                          AS total_items,
       COUNT(br.id)                                          AS confirmed_items,
       COUNT(di.id) - COUNT(br.id)                          AS pending_items,
       BOOL_AND(br.id IS NOT NULL)                          AS all_confirmed
     FROM disbursement_items di
     JOIN disbursement_lists dl ON dl.id = di.list_id
     LEFT JOIN orphans   o ON o.id = di.orphan_id
     LEFT JOIN families  f ON f.id = di.family_id
     LEFT JOIN biometric_receipts br ON br.item_id = di.id
     WHERE dl.id = $1
       AND di.included = TRUE
       AND (o.agent_id = $2 OR f.agent_id = $2)`,
    [listId, agentId]
  );
  return rows[0];
};

/**
 * Confirm that all receipts for a batch have been submitted.
 */
const batchConfirm = async (agentId, listId, notes = null) => {
  const summary = await getAgentReceiptSummary(agentId, listId);
  
  if (parseInt(summary.total_items, 10) === 0) {
    throw Object.assign(new Error('لا يوجد مستفيدين في هذا الكشف'), { status: 400 });
  }
  if (!summary.all_confirmed) {
    throw Object.assign(new Error(`لم يتم تسجيل بصمات جميع المستفيدين (متبقي ${summary.pending_items})`), { status: 400 });
  }

  const { rows } = await query(
    `INSERT INTO agent_batch_confirmations (list_id, agent_id, notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (list_id, agent_id) DO NOTHING
     RETURNING *`,
    [listId, agentId, notes]
  );

  if (rows.length > 0) {
    await logAudit({
      userId:     agentId,
      action:     'agent_batch_confirmed',
      entityType: 'agent_batch_confirmation',
      entityId:   listId,
      newValue:   { list_id: listId, agent_id: agentId, notes },
    });
  }

  return rows[0] || { list_id: listId, agent_id: agentId, already_confirmed: true };
};

module.exports = { uploadBiometricReceipt, getReceipts, getAgentReceiptSummary, batchConfirm };
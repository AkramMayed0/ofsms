/**
 * auditLog.js — OFSMS Audit Logging Helper
 *
 * Call this after any significant DB mutation.
 * Writes one row to audit_logs with old/new values as JSONB.
 *
 * Usage:
 *   await logAudit({
 *     userId:     req.user.id,
 *     action:     'orphan_status_updated',
 *     entityType: 'orphan',
 *     entityId:   orphan.id,
 *     oldValue:   { status: 'under_review' },
 *     newValue:   { status: 'under_marketing' },
 *   });
 */

const { query } = require('../config/db');

/**
 * @param {Object} params
 * @param {string}  params.userId      - UUID of the user performing the action
 * @param {string}  params.action      - Short snake_case description e.g. 'orphan_status_updated'
 * @param {string}  params.entityType  - Table/entity name e.g. 'orphan', 'family', 'sponsorship'
 * @param {string}  [params.entityId]  - UUID of the affected record
 * @param {Object}  [params.oldValue]  - Snapshot before the change
 * @param {Object}  [params.newValue]  - Snapshot after the change
 * @returns {Promise<Object>} the inserted audit_log row
 */
const logAudit = async ({
  userId,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
}) => {
  const { rows } = await query(
    `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
    ]
  );
  return rows[0];
};

module.exports = { logAudit };
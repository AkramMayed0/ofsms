/**
 * families.service.js
 * All database queries for the families module.
 */

const { query } = require('../../config/db');

/**
 * Create a new family record.
 * Initial status is always 'under_review'.
 */
const createFamily = async ({ familyName, headOfFamily, memberCount, governorateId, agentId, notes }) => {
  const { rows } = await query(
    `INSERT INTO families
       (family_name, head_of_family, member_count, governorate_id, agent_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [familyName, headOfFamily, memberCount, governorateId, agentId, notes || null]
  );
  return rows[0];
};

/**
 * Get all families — supports filtering by status and agent.
 * Agents only see their own families (enforced in controller via req.user).
 */
const getFamilies = async ({ status, agentId } = {}) => {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`f.status = $${params.length}`);
  }

  if (agentId) {
    params.push(agentId);
    conditions.push(`f.agent_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT
       f.id, f.family_name, f.head_of_family, f.member_count,
       f.status, f.is_active, f.notes, f.created_at,
       g.name_ar AS governorate_ar, g.name_en AS governorate_en,
       u.full_name AS agent_name
     FROM families f
     LEFT JOIN governorates g ON g.id = f.governorate_id
     LEFT JOIN users u ON u.id = f.agent_id
     ${where}
     ORDER BY f.created_at DESC`,
    params
  );
  return rows;
};

/**
 * Get a single family by ID with documents.
 */
const getFamilyById = async (id) => {
  const { rows } = await query(
    `SELECT
       f.*,
       g.name_ar AS governorate_ar, g.name_en AS governorate_en,
       u.full_name AS agent_name
     FROM families f
     LEFT JOIN governorates g ON g.id = f.governorate_id
     LEFT JOIN users u ON u.id = f.agent_id
     WHERE f.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Update family status (supervisor / GM only).
 * Valid transitions per SADD:
 *   under_review → under_marketing (approved)
 *   under_review → rejected
 *   under_marketing → under_sponsorship (GM assigns sponsor)
 */
const updateFamilyStatus = async (id, status, notes) => {
  const { rows } = await query(
    `UPDATE families
     SET status = $1, notes = COALESCE($2, notes)
     WHERE id = $3
     RETURNING *`,
    [status, notes || null, id]
  );
  return rows[0] || null;
};

/**
 * Update family details (agent can edit while under_review).
 */
const updateFamily = async (id, { familyName, headOfFamily, memberCount, governorateId, notes }) => {
  const { rows } = await query(
    `UPDATE families
     SET
       family_name    = COALESCE($1, family_name),
       head_of_family = COALESCE($2, head_of_family),
       member_count   = COALESCE($3, member_count),
       governorate_id = COALESCE($4, governorate_id),
       notes          = COALESCE($5, notes)
     WHERE id = $6
     RETURNING *`,
    [familyName, headOfFamily, memberCount, governorateId, notes, id]
  );
  return rows[0] || null;
};

/**
 * Get families under marketing (available for sponsorship assignment).
 * Used by GM in the marketing pool screen.
 */
const getFamiliesUnderMarketing = async () => {
  const { rows } = await query(
    `SELECT
       f.id, f.family_name, f.head_of_family, f.member_count,
       f.created_at,
       g.name_ar AS governorate_ar,
       u.full_name AS agent_name
     FROM families f
     LEFT JOIN governorates g ON g.id = f.governorate_id
     LEFT JOIN users u ON u.id = f.agent_id
     WHERE f.status = 'under_marketing'
     ORDER BY f.created_at ASC`
  );
  return rows;
};

/**
 * Get documents for a family.
 */
const getFamilyDocuments = async (familyId) => {
  const { rows } = await query(
    `SELECT id, doc_type, file_key, original_name, uploaded_at
     FROM documents
     WHERE entity_type = 'family' AND entity_id = $1
     ORDER BY uploaded_at DESC`,
    [familyId]
  );
  return rows;
};

/**
 * Save a document record after S3 upload.
 */
const addDocument = async ({ entityType, entityId, docType, fileKey, originalName, uploadedBy }) => {
  const { rows } = await query(
    `INSERT INTO documents
       (entity_type, entity_id, doc_type, file_key, original_name, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [entityType, entityId, docType, fileKey, originalName, uploadedBy]
  );
  return rows[0];
};

module.exports = {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamilyStatus,
  updateFamily,
  getFamiliesUnderMarketing,
  getFamilyDocuments,
  addDocument,
};

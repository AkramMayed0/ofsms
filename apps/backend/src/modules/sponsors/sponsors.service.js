/**
 * sponsors.service.js
 * All database queries for the sponsors module.
 */

const { query } = require('../../config/db');
const crypto = require('crypto');

/**
 * Generate a cryptographically secure unique portal token.
 */
const generatePortalToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Create a new sponsor record.
 * portal_password_hash must already be bcrypt-hashed by the controller.
 */
const createSponsor = async ({ fullName, phone, email, portalPasswordHash, createdBy }) => {
  const portalToken = generatePortalToken();

  const { rows } = await query(
    `INSERT INTO sponsors
       (full_name, phone, email, portal_token, portal_password_hash, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, full_name, phone, email, portal_token, created_at`,
    [fullName, phone, email, portalToken, portalPasswordHash, createdBy]
  );
  return rows[0];
};

/**
 * Get all sponsors (GM only) — excludes password hash.
 */
const getAllSponsors = async () => {
  const { rows } = await query(
    `SELECT
       s.id, s.full_name, s.phone, s.email, s.portal_token,
       s.created_at,
       u.full_name AS created_by_name,
       COUNT(sp.id) FILTER (WHERE sp.is_active) AS active_sponsorships
     FROM sponsors s
     LEFT JOIN users u ON u.id = s.created_by
     LEFT JOIN sponsorships sp ON sp.sponsor_id = s.id
     GROUP BY s.id, u.full_name
     ORDER BY s.created_at DESC`
  );
  return rows;
};

/**
 * Get a single sponsor by ID with their sponsorships.
 */
const getSponsorById = async (id) => {
  const { rows } = await query(
    `SELECT
       s.id, s.full_name, s.phone, s.email, s.portal_token,
       s.created_at, u.full_name AS created_by_name
     FROM sponsors s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Get a sponsor by portal token (used for portal login).
 * Returns password hash for bcrypt comparison.
 */
const getSponsorByToken = async (portalToken) => {
  const { rows } = await query(
    `SELECT id, full_name, email, portal_token, portal_password_hash
     FROM sponsors
     WHERE portal_token = $1`,
    [portalToken]
  );
  return rows[0] || null;
};

/**
 * Get all active sponsorships for a sponsor (used in sponsor portal).
 */
const getSponsorshipsBySponsorId = async (sponsorId) => {
  const { rows } = await query(
    `SELECT
       sp.id, sp.beneficiary_type, sp.beneficiary_id,
       sp.monthly_amount, sp.start_date, sp.intermediary, sp.is_active,
       u.full_name AS agent_name
     FROM sponsorships sp
     LEFT JOIN users u ON u.id = sp.agent_id
     WHERE sp.sponsor_id = $1
     ORDER BY sp.is_active DESC, sp.start_date DESC`,
    [sponsorId]
  );
  return rows;
};

/**
 * Create a new sponsorship (called when GM assigns a sponsor to a beneficiary).
 * Automatically deactivates any existing active sponsorship for the same beneficiary.
 */
const createSponsorship = async ({
  sponsorId,
  beneficiaryType,
  beneficiaryId,
  agentId,
  intermediary,
  startDate,
  monthlyAmount,
}) => {
  // Deactivate any existing active sponsorship for this beneficiary
  await query(
    `UPDATE sponsorships
     SET is_active = FALSE, end_date = NOW(), end_reason = 'reassigned'
     WHERE beneficiary_type = $1 AND beneficiary_id = $2 AND is_active = TRUE`,
    [beneficiaryType, beneficiaryId]
  );

  const { rows } = await query(
    `INSERT INTO sponsorships
       (sponsor_id, beneficiary_type, beneficiary_id, agent_id,
        intermediary, start_date, monthly_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [sponsorId, beneficiaryType, beneficiaryId, agentId, intermediary, startDate, monthlyAmount]
  );
  return rows[0];
};

/**
 * Transfer a beneficiary from one sponsor to another (GM only).
 * Closes old sponsorship and opens a new one.
 */
const transferSponsorship = async ({
  beneficiaryType,
  beneficiaryId,
  newSponsorId,
  agentId,
  monthlyAmount,
  endReason,
}) => {
  await query(
    `UPDATE sponsorships
     SET is_active = FALSE, end_date = NOW(), end_reason = $1
     WHERE beneficiary_type = $2 AND beneficiary_id = $3 AND is_active = TRUE`,
    [endReason || 'transferred', beneficiaryType, beneficiaryId]
  );

  const { rows } = await query(
    `INSERT INTO sponsorships
       (sponsor_id, beneficiary_type, beneficiary_id, agent_id,
        start_date, monthly_amount)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     RETURNING *`,
    [newSponsorId, beneficiaryType, beneficiaryId, agentId, monthlyAmount]
  );
  return rows[0];
};

module.exports = {
  createSponsor,
  getAllSponsors,
  getSponsorById,
  getSponsorByToken,
  getSponsorshipsBySponsorId,
  createSponsorship,
  transferSponsorship,
};

/**
 * notifications.repository.js
 * All database queries for the notifications module.
 */

const { query } = require('../../config/db');

const registerToken = async (userId, token, userAgent) => {
  await query(
    `INSERT INTO fcm_tokens (user_id, token, user_agent)
     VALUES ($1, $2, $3)
     ON CONFLICT (token)
     DO UPDATE SET user_id = EXCLUDED.user_id, user_agent = EXCLUDED.user_agent, updated_at = NOW()`,
    [userId, token, userAgent]
  );
};

const unregisterToken = async (token, userId) => {
  await query(
    'DELETE FROM fcm_tokens WHERE token = $1 AND user_id = $2',
    [token, userId]
  );
};

const getNotifications = async (userId, limit, offset) => {
  const { rows } = await query(
    `SELECT id, message, type, is_read, related_entity_id, created_at
     FROM notifications
     WHERE recipient_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
};

const getUnreadCount = async (userId) => {
  const { rows: [{ count }] } = await query(
    'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(count);
};

const markOneRead = async (notificationId, userId) => {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND recipient_id = $2
     RETURNING id`,
    [notificationId, userId]
  );
  return rows[0] || null;
};

const markAllRead = async (userId) => {
  await query(
    'UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1',
    [userId]
  );
};

const getActiveUsersByIds = async (userIds) => {
  const { rows } = await query(
    `SELECT id FROM users WHERE id = ANY($1) AND is_active = TRUE`,
    [userIds]
  );
  return rows.map((r) => r.id);
};

const getActiveUsersByRoles = async (roles) => {
  const { rows } = await query(
    `SELECT id FROM users WHERE role = ANY($1) AND is_active = TRUE`,
    [roles]
  );
  return rows.map((r) => r.id);
};

const getAllActiveStaffIds = async () => {
  const { rows } = await query(
    `SELECT id FROM users WHERE is_active = TRUE AND role != 'sponsor'`
  );
  return rows.map((r) => r.id);
};

module.exports = {
  registerToken,
  unregisterToken,
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  getActiveUsersByIds,
  getActiveUsersByRoles,
  getAllActiveStaffIds,
};

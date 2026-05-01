const { query } = require('../../config/db');

const createAnnouncement = async ({ title, body, createdBy }) => {
  const { rows } = await query(
    `INSERT INTO announcements (title, body, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [title, body, createdBy]
  );
  return rows[0];
};

const getActiveAnnouncements = async () => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.body, a.published_at, a.is_active,
            u.full_name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_active = TRUE
     ORDER BY a.published_at DESC`
  );
  return rows;
};

const getAllAnnouncements = async () => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.body, a.published_at, a.is_active,
            u.full_name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.published_at DESC`
  );
  return rows;
};

const updateAnnouncement = async (id, { title, body, isActive }) => {
  const { rows } = await query(
    `UPDATE announcements
     SET title     = COALESCE($1, title),
         body      = COALESCE($2, body),
         is_active = COALESCE($3, is_active)
     WHERE id = $4
     RETURNING *`,
    [title ?? null, body ?? null, isActive ?? null, id]
  );
  return rows[0] || null;
};

const deleteAnnouncement = async (id) => {
  const { rows } = await query(
    `UPDATE announcements SET is_active = FALSE WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
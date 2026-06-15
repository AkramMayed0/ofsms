const { sendBulkNotification } = require('../notifications/notifications.service');
const { query } = require('../../config/db');

const createAnnouncement = async ({
  title,
  body,
  createdBy,
  audience = 'staff',
  notifyStaff = true,
}) => {
  const { rows } = await query(
    `INSERT INTO announcements (title, body, created_by, audience)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, body, createdBy, audience]
  );
  const announcement = rows[0];

  if (notifyStaff && audience === 'staff') {
    const { rows: users } = await query(
      `SELECT id FROM users WHERE is_active = TRUE AND id != $1`,
      [createdBy]
    );
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      sendBulkNotification(
        userIds,
        `إعلان جديد: ${title}`,
        body,
        { link: '/announcements', announcementId: announcement.id },
        'announcement'
      ).catch(() => {});
    }
  }

  return announcement;
};

const createSponsorOrphanAd = async ({ orphan, createdBy }) => {
  const age = orphan.date_of_birth
    ? Math.floor((Date.now() - new Date(orphan.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bodyParts = [
    'من سيكفل هذا الطفل؟',
    `الاسم: ${orphan.full_name}`,
    age !== null ? `العمر: ${age} سنة` : null,
    orphan.governorate_ar ? `المحافظة: ${orphan.governorate_ar}` : null,
    orphan.guardian_name ? `الوصي: ${orphan.guardian_name}` : null,
    orphan.is_gifted ? 'ملاحظة: الطفل موهوب' : null,
  ].filter(Boolean);

  return createAnnouncement({
    title: `طلب كفالة: ${orphan.full_name}`,
    body: bodyParts.join('\n'),
    createdBy,
    audience: 'sponsor',
    notifyStaff: false,
  });
};

const createSponsorFamilyAd = async ({ family, createdBy }) => {
  const bodyParts = [
    'من سيكفل هذه الأسرة؟',
    `اسم الأسرة: ${family.family_name}`,
    family.head_of_family ? `رب الأسرة: ${family.head_of_family}` : null,
    family.member_count ? `عدد الأفراد: ${family.member_count}` : null,
    family.governorate_ar ? `المحافظة: ${family.governorate_ar}` : null,
  ].filter(Boolean);

  return createAnnouncement({
    title: `طلب كفالة أسرة: ${family.family_name}`,
    body: bodyParts.join('\n'),
    createdBy,
    audience: 'sponsor',
    notifyStaff: false,
  });
};

const getActiveAnnouncements = async () => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.body, a.published_at, a.is_active,
            u.full_name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_active = TRUE
       AND a.audience = 'staff'
     ORDER BY a.published_at DESC`
  );
  return rows;
};

const getActiveSponsorAnnouncements = async () => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.body, a.published_at, a.is_active,
            u.full_name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_active = TRUE
       AND a.audience = 'sponsor'
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
     WHERE a.audience = 'staff'
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
       AND audience = 'staff'
     RETURNING *`,
    [title ?? null, body ?? null, isActive ?? null, id]
  );
  return rows[0] || null;
};

const deleteAnnouncement = async (id) => {
  const { rows } = await query(
    `DELETE FROM announcements
     WHERE id = $1
       AND audience = 'staff'
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  createAnnouncement,
  createSponsorOrphanAd,
  createSponsorFamilyAd,
  getActiveAnnouncements,
  getActiveSponsorAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};

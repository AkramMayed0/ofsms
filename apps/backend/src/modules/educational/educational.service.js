/**
 * educational.service.js — Educational & Awareness Programs Business Logic
 */

const { query } = require('../../config/db');

// ── Categories ───────────────────────────────────────────────────────────────

const getCategories = async () => {
  const { rows } = await query(`
    SELECT c.*, COUNT(p.id) AS program_count
    FROM educational_categories c
    LEFT JOIN educational_programs p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);
  return rows;
};

// ── Templates ────────────────────────────────────────────────────────────────

const getTemplates = async ({ search, categoryId } = {}) => {
  const conditions = [];
  const params = [];

  if (categoryId && categoryId !== 'all') {
    params.push(parseInt(categoryId, 10));
    conditions.push(`t.category_id = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(`
    SELECT
      t.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      COUNT(p.id) AS usage_count
    FROM educational_templates t
    LEFT JOIN educational_categories c ON c.id = t.category_id
    LEFT JOIN educational_programs p ON p.template_id = t.id
    ${whereClause}
    GROUP BY t.id, c.name, c.icon, c.color
    ORDER BY t.created_at DESC
  `, params);

  return rows;
};

const getTemplateById = async (id) => {
  const { rows: [template] } = await query(`
    SELECT t.*, c.name AS category_name
    FROM educational_templates t
    LEFT JOIN educational_categories c ON c.id = t.category_id
    WHERE t.id = $1
  `, [id]);
  return template || null;
};

const createTemplate = async ({
  title,
  categoryId,
  description,
  defaultDurationDays = 14,
  defaultSessions = 1,
  targetAudience = 'الأيتام والطلاب',
  userId,
}) => {
  const { rows } = await query(`
    INSERT INTO educational_templates
      (title, category_id, description, default_duration_days, default_sessions, target_audience, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    title.trim(),
    categoryId ? parseInt(categoryId, 10) : null,
    description ? description.trim() : null,
    parseInt(defaultDurationDays, 10) || 14,
    parseInt(defaultSessions, 10) || 1,
    targetAudience ? targetAudience.trim() : 'الأيتام والطلاب',
    userId || null,
  ]);
  return rows[0];
};

const updateTemplate = async (id, data) => {
  const fields = [];
  const params = [id];

  if (data.title !== undefined) {
    params.push(data.title.trim());
    fields.push(`title = $${params.length}`);
  }
  if (data.categoryId !== undefined) {
    params.push(data.categoryId ? parseInt(data.categoryId, 10) : null);
    fields.push(`category_id = $${params.length}`);
  }
  if (data.description !== undefined) {
    params.push(data.description ? data.description.trim() : null);
    fields.push(`description = $${params.length}`);
  }
  if (data.defaultDurationDays !== undefined) {
    params.push(parseInt(data.defaultDurationDays, 10) || 14);
    fields.push(`default_duration_days = $${params.length}`);
  }
  if (data.defaultSessions !== undefined) {
    params.push(parseInt(data.defaultSessions, 10) || 1);
    fields.push(`default_sessions = $${params.length}`);
  }
  if (data.targetAudience !== undefined) {
    params.push(data.targetAudience ? data.targetAudience.trim() : null);
    fields.push(`target_audience = $${params.length}`);
  }

  fields.push(`updated_at = NOW()`);

  const { rows } = await query(`
    UPDATE educational_templates
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);

  return rows[0] || null;
};

const deleteTemplate = async (id) => {
  const { rows } = await query(
    `DELETE FROM educational_templates WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

// ── Programs ─────────────────────────────────────────────────────────────────

const getPrograms = async ({ status, categoryId, search } = {}) => {
  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }

  if (categoryId && categoryId !== 'all') {
    params.push(parseInt(categoryId, 10));
    conditions.push(`p.category_id = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(p.title ILIKE $${params.length} OR p.location ILIKE $${params.length} OR p.notes ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(`
    SELECT
      p.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      t.title AS template_title,
      COUNT(DISTINCT part.id) AS participant_count,
      COUNT(DISTINCT part.id) FILTER (WHERE part.status = 'completed') AS completed_participants_count
    FROM educational_programs p
    LEFT JOIN educational_categories c ON c.id = p.category_id
    LEFT JOIN educational_templates t ON t.id = p.template_id
    LEFT JOIN educational_participants part ON part.program_id = p.id
    ${whereClause}
    GROUP BY p.id, c.name, c.icon, c.color, t.title
    ORDER BY p.created_at DESC
  `, params);

  return rows.map((r) => ({
    ...r,
    participant_count: parseInt(r.participant_count, 10) || 0,
    completed_participants_count: parseInt(r.completed_participants_count, 10) || 0,
  }));
};

const getProgramById = async (id) => {
  const { rows: [program] } = await query(`
    SELECT
      p.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      t.title AS template_title,
      u.full_name AS creator_name,
      COUNT(DISTINCT part.id) AS participant_count
    FROM educational_programs p
    LEFT JOIN educational_categories c ON c.id = p.category_id
    LEFT JOIN educational_templates t ON t.id = p.template_id
    LEFT JOIN users u ON u.id = p.created_by
    LEFT JOIN educational_participants part ON part.program_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, c.name, c.icon, c.color, t.title, u.full_name
  `, [id]);

  if (!program) return null;

  // Fetch participants with orphan profile details
  const { rows: participants } = await query(`
    SELECT
      part.id AS participant_id,
      part.status,
      part.attended_sessions,
      part.notes,
      part.created_at,
      o.id AS orphan_id,
      o.full_name AS orphan_name,
      CONCAT('ORP-', LPAD(SUBSTRING(o.id::text, 1, 6), 6, '0')) AS orphan_code,
      o.guardian_name,
      o.guardian_relation,
      o.date_of_birth,
      gov.name_ar AS governorate_ar
    FROM educational_participants part
    JOIN orphans o ON o.id = part.orphan_id
    LEFT JOIN governorates gov ON gov.id = o.governorate_id
    WHERE part.program_id = $1
    ORDER BY part.created_at ASC
  `, [id]);

  return {
    ...program,
    participant_count: parseInt(program.participant_count, 10) || 0,
    participants,
  };
};

const createProgram = async ({
  title,
  categoryId,
  templateId = null,
  status = 'draft',
  location,
  startDate = null,
  endDate = null,
  totalSessions = 1,
  targetCount = 20,
  instructorName = null,
  notes = null,
  userId = null,
}) => {
  const { rows } = await query(`
    INSERT INTO educational_programs
      (title, category_id, template_id, status, location, start_date, end_date, total_sessions, target_count, instructor_name, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    title.trim(),
    categoryId ? parseInt(categoryId, 10) : null,
    templateId || null,
    status,
    location ? location.trim() : null,
    startDate || null,
    endDate || null,
    parseInt(totalSessions, 10) || 1,
    parseInt(targetCount, 10) || 20,
    instructorName ? instructorName.trim() : null,
    notes ? notes.trim() : null,
    userId || null,
  ]);
  return rows[0];
};

const updateProgram = async (id, data) => {
  const fields = [];
  const params = [id];

  if (data.title !== undefined) {
    params.push(data.title.trim());
    fields.push(`title = $${params.length}`);
  }
  if (data.categoryId !== undefined) {
    params.push(data.categoryId ? parseInt(data.categoryId, 10) : null);
    fields.push(`category_id = $${params.length}`);
  }
  if (data.status !== undefined) {
    params.push(data.status);
    fields.push(`status = $${params.length}`);
  }
  if (data.location !== undefined) {
    params.push(data.location ? data.location.trim() : null);
    fields.push(`location = $${params.length}`);
  }
  if (data.startDate !== undefined) {
    params.push(data.startDate || null);
    fields.push(`start_date = $${params.length}`);
  }
  if (data.endDate !== undefined) {
    params.push(data.endDate || null);
    fields.push(`end_date = $${params.length}`);
  }
  if (data.totalSessions !== undefined) {
    params.push(parseInt(data.totalSessions, 10) || 1);
    fields.push(`total_sessions = $${params.length}`);
  }
  if (data.completedSessions !== undefined) {
    params.push(parseInt(data.completedSessions, 10) || 0);
    fields.push(`completed_sessions = $${params.length}`);
  }
  if (data.targetCount !== undefined) {
    params.push(parseInt(data.targetCount, 10) || 20);
    fields.push(`target_count = $${params.length}`);
  }
  if (data.instructorName !== undefined) {
    params.push(data.instructorName ? data.instructorName.trim() : null);
    fields.push(`instructor_name = $${params.length}`);
  }
  if (data.notes !== undefined) {
    params.push(data.notes ? data.notes.trim() : null);
    fields.push(`notes = $${params.length}`);
  }

  fields.push(`updated_at = NOW()`);

  const { rows } = await query(`
    UPDATE educational_programs
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);

  return rows[0] || null;
};

const updateProgramStatus = async (id, status) => {
  const { rows } = await query(`
    UPDATE educational_programs
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, status]);
  return rows[0] || null;
};

const deleteProgram = async (id) => {
  const { rows } = await query(
    `DELETE FROM educational_programs WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

// ── Participants ─────────────────────────────────────────────────────────────

const addParticipants = async (programId, orphanIds) => {
  const added = [];
  for (const orphanId of orphanIds) {
    const { rows } = await query(`
      INSERT INTO educational_participants (program_id, orphan_id, status)
      VALUES ($1, $2, 'enrolled')
      ON CONFLICT (program_id, orphan_id) DO NOTHING
      RETURNING *
    `, [programId, orphanId]);
    if (rows[0]) added.push(rows[0]);
  }
  return added;
};

const updateParticipant = async (participantId, { status, attendedSessions, notes }) => {
  const fields = [];
  const params = [participantId];

  if (status !== undefined) {
    params.push(status);
    fields.push(`status = $${params.length}`);
  }
  if (attendedSessions !== undefined) {
    params.push(parseInt(attendedSessions, 10) || 0);
    fields.push(`attended_sessions = $${params.length}`);
  }
  if (notes !== undefined) {
    params.push(notes ? notes.trim() : null);
    fields.push(`notes = $${params.length}`);
  }

  if (fields.length === 0) return null;

  const { rows } = await query(`
    UPDATE educational_participants
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);

  return rows[0] || null;
};

const removeParticipant = async (participantId) => {
  const { rows } = await query(
    `DELETE FROM educational_participants WHERE id = $1 RETURNING *`,
    [participantId]
  );
  return rows[0] || null;
};

module.exports = {
  getCategories,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  updateProgramStatus,
  deleteProgram,
  addParticipants,
  updateParticipant,
  removeParticipant,
};

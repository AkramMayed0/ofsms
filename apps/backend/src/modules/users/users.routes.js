/**
 * users.routes.js
 * Mounted at: /api/users  (GM only for all write ops)
 * Also handles: GET /api/audit-logs (GM only)
 */

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');
const { logAudit } = require('../../utils/auditLog');
const { createUserRules, updateUserRules, validateRequest } = require('./users.validators');

// ── GET /api/users ─────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('gm'), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, role, phone, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

// ── POST /api/users ────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('gm'), createUserRules, validateRequest, async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // Check duplicate email (email already normalized by validator)
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // Check duplicate phone (only if provided)
    if (phone) {
      const { rows: phoneExists } = await query(
        'SELECT id FROM users WHERE phone = $1', [phone]
      );
      if (phoneExists.length > 0) {
        return res.status(409).json({ error: 'رقم الهاتف مستخدم بالفعل' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const finalPhone = phone ? phone : null;
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone, is_active, created_at`,
      [fullName.trim(), email, passwordHash, role, phone || null]
    );

    await logAudit({
      userId: req.user.id, action: 'user_created',
      entityType: 'user', entityId: rows[0].id,
      newValue: { email: rows[0].email, role },
    });

    return res.status(201).json({ message: 'تم إنشاء المستخدم بنجاح', user: rows[0] });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id ───────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize('gm'), updateUserRules, validateRequest, async (req, res, next) => {
  try {
    const { fullName, phone, role } = req.body;
    const { rows } = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone     = COALESCE($2, phone),
           role      = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, full_name, email, role, phone, is_active`,
      [fullName || null, phone || null, role || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    await logAudit({
      userId: req.user.id, action: 'user_updated',
      entityType: 'user', entityId: req.params.id,
      newValue: { fullName, phone, role },
    });

    return res.json({ message: 'تم تحديث بيانات المستخدم', user: rows[0] });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id/deactivate ───────────────────────────────────────
router.patch('/:id/deactivate', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    // Prevent GM from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'لا يمكنك إيقاف حسابك الخاص' });
    }
    const { rows } = await query(
      `UPDATE users SET is_active = FALSE WHERE id = $1
       RETURNING id, full_name, email, role, is_active`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    await logAudit({
      userId: req.user.id, action: 'user_deactivated',
      entityType: 'user', entityId: req.params.id,
    });

    return res.json({ message: 'تم إيقاف الحساب', user: rows[0] });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id/activate ─────────────────────────────────────────
router.patch('/:id/activate', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE users SET is_active = TRUE WHERE id = $1
       RETURNING id, full_name, email, role, is_active`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    await logAudit({
      userId: req.user.id, action: 'user_activated',
      entityType: 'user', entityId: req.params.id,
    });

    return res.json({ message: 'تم تفعيل الحساب', user: rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }
    const { rows } = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, full_name',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    await logAudit({
      userId: req.user.id, action: 'user_deleted',
      entityType: 'user', entityId: req.params.id,
      oldValue: { fullName: rows[0].full_name },
    });

    return res.json({ message: `تم حذف المستخدم ${rows[0].full_name}` });
  } catch (err) { next(err); }
});

// ── GET /api/audit-logs ────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const { entityType, entityId, limit = 20, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (entityType) { params.push(entityType); conditions.push(`al.entity_type = $${params.length}`); }
    if (entityId)   { params.push(entityId);   conditions.push(`al.entity_id = $${params.length}`); }

    params.push(Math.min(parseInt(limit), 100));
    params.push(parseInt(offset));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id,
              al.old_value, al.new_value, al.created_at,
              u.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ logs: rows });
  } catch (err) { next(err); }
});

module.exports = router;
/**
 * notifications.routes.js
 * Mounted at: /api/notifications
 *
 * POST   /api/notifications/register-token   → save FCM token for current user
 * DELETE /api/notifications/unregister-token → remove token on logout
 * GET    /api/notifications                  → list notifications for current user
 * PATCH  /api/notifications/:id/read         → mark single notification as read
 * PATCH  /api/notifications/read-all         → mark all as read
 *
 * POST   /api/notifications/test/trigger-cron → manual trigger for testing (non-production)
 */

const { Router } = require('express');
const { body }   = require('express-validator');
const { authenticate } = require('../../middleware/rbac');
const { validationResult } = require('express-validator');
const { query } = require('../../config/db');
const {
  remindAgentsToSubmitReports,
  remindSupervisorToFollowUp,
  remindDisbursementDeadline,
} = require('../../scheduler');

const router = Router();

// ── POST /api/notifications/register-token ────────────────────────────────────
router.post(
  '/register-token',
  authenticate,
  [body('token').notEmpty().withMessage('FCM token مطلوب')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { token } = req.body;
      const userAgent = req.headers['user-agent'] || null;

      // Upsert: if token already exists update its user_id + user_agent
      await query(
        `INSERT INTO fcm_tokens (user_id, token, user_agent)
         VALUES ($1, $2, $3)
         ON CONFLICT (token)
         DO UPDATE SET user_id = EXCLUDED.user_id, user_agent = EXCLUDED.user_agent, updated_at = NOW()`,
        [req.user.id, token, userAgent]
      );

      return res.json({ message: 'تم تسجيل الجهاز للإشعارات بنجاح' });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/notifications/unregister-token ────────────────────────────────
router.delete(
  '/unregister-token',
  authenticate,
  [body('token').notEmpty().withMessage('FCM token مطلوب')],
  async (req, res, next) => {
    try {
      await query(
        'DELETE FROM fcm_tokens WHERE token = $1 AND user_id = $2',
        [req.body.token, req.user.id]
      );
      return res.json({ message: 'تم إلغاء تسجيل الجهاز' });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await query(
      `SELECT id, message, type, is_read, related_entity_id, created_at
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const { rows: [{ count }] } = await query(
      'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    return res.json({ notifications: rows, unread_count: parseInt(count) });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
// NOTE: must be defined BEFORE /:id/read to avoid route conflict
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1',
      [req.user.id]
    );
    return res.json({ message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الإشعار غير موجود' });
    return res.json({ message: 'تم تعليم الإشعار كمقروء' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/notifications/test/trigger-cron ─────────────────────────────────
// Manual trigger for testing — disabled in production
router.post('/test/trigger-cron', authenticate, async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'غير متاح في بيئة الإنتاج' });
  }

  const { job } = req.body; // 'agents' | 'supervisor' | 'disbursement'

  try {
    if (job === 'agents')       await remindAgentsToSubmitReports();
    else if (job === 'supervisor') await remindSupervisorToFollowUp();
    else if (job === 'disbursement') await remindDisbursementDeadline();
    else return res.status(400).json({ error: 'job يجب أن يكون: agents | supervisor | disbursement' });

    return res.json({ message: `تم تشغيل المهمة المجدولة: ${job}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

/**
 * notifications.routes.js
 * Mounted at: /api/notifications
 *
 * POST   /api/notifications/register-token   → save FCM token for current user
 * DELETE /api/notifications/unregister-token → remove token on logout
 * GET    /api/notifications                  → list notifications for current user
 * PATCH  /api/notifications/:id/read         → mark single notification as read
 * PATCH  /api/notifications/read-all         → mark all as read
 * POST   /api/notifications/broadcast        → GM only: send manual notification to roles/users
 * POST   /api/notifications/test/trigger-cron → manual trigger for testing (non-production)
 */

const { Router } = require('express');
const { body }   = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const { validationResult } = require('express-validator');
const { query } = require('../../config/db');
const { sendBulkNotification, sendPushNotification } = require('./notifications.service');

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

// ── POST /api/notifications/broadcast ────────────────────────────────────────
/**
 * GM only — send a manual notification to one or more target groups.
 *
 * Body:
 *   message  {string}   - The notification text (required)
 *   targets  {string[]} - One or more of: 'agent' | 'supervisor' | 'finance' | 'gm' | 'all'
 *                         OR pass specific userIds instead (see below)
 *   userIds  {string[]} - Optional: specific user UUIDs to notify (overrides targets if provided)
 *
 * Examples:
 *   { message: 'اجتماع غداً', targets: ['agent', 'supervisor'] }
 *   { message: 'رسالة خاصة', userIds: ['uuid-1', 'uuid-2'] }
 */
router.post(
  '/broadcast',
  authenticate,
  authorize('gm'),
  [
    body('message')
      .trim()
      .notEmpty().withMessage('نص الإشعار مطلوب')
      .isLength({ max: 500 }).withMessage('النص لا يتجاوز 500 حرف'),
    body('targets')
      .optional()
      .isArray({ min: 1 }).withMessage('يجب تحديد جهة واحدة على الأقل')
      .custom((arr) => {
        const valid = ['agent', 'supervisor', 'finance', 'gm', 'all'];
        if (!arr.every((t) => valid.includes(t))) {
          throw new Error('قيم targets غير صحيحة. المسموح: agent, supervisor, finance, gm, all');
        }
        return true;
      }),
    body('userIds')
      .optional()
      .isArray({ min: 1 }).withMessage('يجب تحديد مستخدم واحد على الأقل')
      .custom((arr) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!arr.every((id) => uuidRegex.test(id))) {
          throw new Error('بعض معرفات المستخدمين غير صحيحة');
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { message, targets, userIds } = req.body;

      // Must provide either targets or userIds
      if (!targets?.length && !userIds?.length) {
        return res.status(422).json({
          error: 'يجب تحديد targets (أدوار) أو userIds (مستخدمين محددين)',
        });
      }

      let recipientIds = [];

      if (userIds?.length) {
        // Specific users — verify they exist and are active
        const { rows } = await query(
          `SELECT id FROM users WHERE id = ANY($1) AND is_active = TRUE`,
          [userIds]
        );
        recipientIds = rows.map((r) => r.id);

        if (recipientIds.length === 0) {
          return res.status(404).json({ error: 'لم يُعثر على مستخدمين نشطين بالمعرفات المحددة' });
        }
      } else {
        // Role-based targeting
        if (targets.includes('all')) {
          // Everyone except sponsors (they have no notifications table access)
          const { rows } = await query(
            `SELECT id FROM users WHERE is_active = TRUE AND role != 'sponsor'`
          );
          recipientIds = rows.map((r) => r.id);
        } else {
          const { rows } = await query(
            `SELECT id FROM users WHERE role = ANY($1) AND is_active = TRUE`,
            [targets]
          );
          recipientIds = rows.map((r) => r.id);
        }

        if (recipientIds.length === 0) {
          return res.status(404).json({ error: 'لا يوجد مستخدمون نشطون في الأدوار المحددة' });
        }
      }

      // Send notifications
      const result = await sendBulkNotification(
        recipientIds,
        'إشعار من المدير العام',
        message,
        { sentBy: req.user.id },
        'general'
      );

      return res.json({
        message: `تم إرسال الإشعار بنجاح`,
        recipients: recipientIds.length,
        delivered: result.sent,
        failed: result.failed,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/notifications/test/trigger-cron ─────────────────────────────────
router.post('/test/trigger-cron', authenticate, async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'غير متاح في بيئة الإنتاج' });
  }

  const {
    remindAgentsToSubmitReports,
    remindSupervisorToFollowUp,
    remindDisbursementDeadline,
  } = require('../../scheduler');

  const { job } = req.body;

  try {
    if (job === 'agents')            await remindAgentsToSubmitReports();
    else if (job === 'supervisor')   await remindSupervisorToFollowUp();
    else if (job === 'disbursement') await remindDisbursementDeadline();
    else return res.status(400).json({ error: 'job يجب أن يكون: agents | supervisor | disbursement' });

    return res.json({ message: `تم تشغيل المهمة المجدولة: ${job}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
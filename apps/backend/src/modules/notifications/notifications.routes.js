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
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./notifications.controller');
const validators = require('./notifications.validators');

const router = Router();

// ── POST /api/notifications/register-token ────────────────────────────────────
router.post('/register-token',   authenticate, validators.registerTokenRules,   controller.registerToken);

// ── DELETE /api/notifications/unregister-token ────────────────────────────────
router.delete('/unregister-token', authenticate, validators.unregisterTokenRules, controller.unregisterToken);

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', authenticate, controller.listNotifications);

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
// NOTE: must be defined BEFORE /:id/read to avoid route conflict
router.patch('/read-all', authenticate, controller.markAllRead);

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', authenticate, controller.markOneRead);

// ── POST /api/notifications/broadcast ────────────────────────────────────────
router.post('/broadcast', authenticate, authorize('gm'), validators.broadcastRules, controller.broadcast);

// ── POST /api/notifications/test/trigger-cron ─────────────────────────────────
router.post('/test/trigger-cron', authenticate, controller.triggerCron);

module.exports = router;
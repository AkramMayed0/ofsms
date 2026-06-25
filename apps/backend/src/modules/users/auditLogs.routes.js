/**
 * auditLogs.routes.js — OFSMS Audit Logs Endpoint
 *
 * Mounted at: /api/audit-logs
 *
 * Delegates to the users controller which already handles audit log queries.
 * Kept as a dedicated router to cleanly separate the mount path from users.
 */

const express = require('express');
const router  = express.Router();

const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('../users/users.controller');

// ── GET /api/audit-logs ───────────────────────────────────────────────────────
router.get('/', authenticate, authorize('gm'), controller.getAuditLogs);

module.exports = router;

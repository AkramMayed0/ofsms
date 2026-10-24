/**
 * settings.routes.js
 * Endpoints for System Settings, Reference Lists, Backups, and Audit Logs.
 * Mounted at: /api/settings
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./settings.controller');

const router = Router();

// System Settings Key-Value (GM & Supervisor can view, GM can update)
router.get('/', authenticate, authorize('gm', 'supervisor'), controller.getSettings);
router.put('/', authenticate, authorize('gm', 'supervisor'), controller.updateSettings);

// Reference Lists CRUD
router.get('/reference-lists', authenticate, authorize('gm', 'supervisor', 'agent', 'finance'), controller.getReferenceLists);
router.post('/reference-lists', authenticate, authorize('gm', 'supervisor'), controller.addReferenceItem);
router.put('/reference-lists/:id', authenticate, authorize('gm', 'supervisor'), controller.updateReferenceItem);
router.delete('/reference-lists/:id', authenticate, authorize('gm', 'supervisor'), controller.deleteReferenceItem);

// Backups
router.get('/backups', authenticate, authorize('gm', 'supervisor'), controller.getBackups);
router.post('/backups', authenticate, authorize('gm'), controller.createBackup);

// Audit Logs
router.get('/audit-logs', authenticate, authorize('gm', 'supervisor'), controller.getAuditLogs);

module.exports = router;

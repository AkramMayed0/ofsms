const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./dashboard.controller');

const router = Router();

// GM dashboard summary
router.get('/gm', authenticate, authorize('gm'), controller.getGmDashboard);

// Agent dashboard summary (already In Progress by someone else — wire it here too)
router.get('/agent', authenticate, authorize('agent'), controller.getAgentDashboard);

// Supervisor + GM: supervisor dashboard summary
router.get(
  '/supervisor',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.getSupervisorDashboard
);
module.exports = router;
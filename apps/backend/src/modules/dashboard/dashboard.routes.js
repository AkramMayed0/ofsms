const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./dashboard.controller');

const router = Router();

router.get('/gm',         authenticate, authorize('gm'),                          controller.getGmDashboard);
router.get('/agent',      authenticate, authorize('agent'),                        controller.getAgentDashboard);
router.get('/supervisor', authenticate, authorize('supervisor', 'gm'),             controller.getSupervisorDashboard);
router.get('/finance',    authenticate, authorize('finance', 'gm'),                controller.getFinanceDashboard);

module.exports = router;

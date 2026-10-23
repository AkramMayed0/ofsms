/**
 * inKind.routes.js — Endpoints for in-kind support programs and aid delivery
 * Mounted at: /api/in-kind
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./inKind.controller');

const router = Router();

// Types
router.get('/types', authenticate, controller.getTypes);
router.post('/types', authenticate, authorize('gm', 'supervisor'), controller.createType);
router.delete('/types/:id', authenticate, authorize('gm', 'supervisor'), controller.deleteType);

// Programs
router.get('/programs', authenticate, controller.getPrograms);
router.post('/programs', authenticate, authorize('gm', 'supervisor', 'agent', 'finance'), controller.createProgram);
router.get('/programs/:id', authenticate, controller.getProgramById);
router.put('/programs/:id', authenticate, authorize('gm', 'supervisor'), controller.updateProgram);
router.delete('/programs/:id', authenticate, authorize('gm'), controller.deleteProgram);

// Beneficiaries within a program
router.post('/programs/:id/beneficiaries', authenticate, authorize('gm', 'supervisor', 'agent'), controller.addBeneficiaries);
router.patch('/beneficiaries/:beneficiaryId/deliver', authenticate, authorize('gm', 'supervisor', 'agent'), controller.markDelivery);
router.delete('/beneficiaries/:beneficiaryId', authenticate, authorize('gm', 'supervisor'), controller.removeBeneficiary);

module.exports = router;

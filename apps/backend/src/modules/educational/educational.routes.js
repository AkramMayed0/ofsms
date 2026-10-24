/**
 * educational.routes.js — Endpoints for Educational & Awareness Programs
 * Mounted at: /api/educational
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./educational.controller');

const router = Router();

// Categories lookup
router.get('/categories', authenticate, controller.getCategories);

// Templates
router.get('/templates', authenticate, controller.getTemplates);
router.post('/templates', authenticate, authorize('gm', 'supervisor'), controller.createTemplate);
router.put('/templates/:id', authenticate, authorize('gm', 'supervisor'), controller.updateTemplate);
router.delete('/templates/:id', authenticate, authorize('gm', 'supervisor'), controller.deleteTemplate);

// Programs
router.get('/programs', authenticate, controller.getPrograms);
router.post('/programs', authenticate, authorize('gm', 'supervisor', 'agent'), controller.createProgram);
router.get('/programs/:id', authenticate, controller.getProgramById);
router.put('/programs/:id', authenticate, authorize('gm', 'supervisor', 'agent'), controller.updateProgram);
router.patch('/programs/:id/status', authenticate, authorize('gm', 'supervisor', 'agent'), controller.updateProgramStatus);
router.delete('/programs/:id', authenticate, authorize('gm', 'supervisor'), controller.deleteProgram);

// Participants within a program
router.post('/programs/:id/participants', authenticate, authorize('gm', 'supervisor', 'agent'), controller.addParticipants);
router.patch('/participants/:participantId', authenticate, authorize('gm', 'supervisor', 'agent'), controller.updateParticipant);
router.delete('/participants/:participantId', authenticate, authorize('gm', 'supervisor'), controller.removeParticipant);

module.exports = router;

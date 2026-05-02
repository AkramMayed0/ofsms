const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./announcements.controller');

const router = Router();

const createRules = [
  body('title').trim().notEmpty().withMessage('عنوان الإعلان مطلوب'),
  body('body').trim().notEmpty().withMessage('نص الإعلان مطلوب'),
];

const updateRules = [
  body('title').optional().trim().notEmpty().withMessage('العنوان لا يمكن أن يكون فارغاً'),
  body('body').optional().trim().notEmpty().withMessage('النص لا يمكن أن يكون فارغاً'),
  body('isActive').optional().isBoolean().withMessage('isActive يجب أن يكون true أو false'),
];

// All authenticated users: list announcements
router.get('/', authenticate, controller.getAnnouncements);

// GM only: create
router.post('/', authenticate, authorize('gm'), createRules, controller.createAnnouncement);

// GM only: update
router.patch('/:id', authenticate, authorize('gm'), updateRules, controller.updateAnnouncement);

// GM only: soft-delete
router.delete('/:id', authenticate, authorize('gm'), controller.deleteAnnouncement);

module.exports = router;
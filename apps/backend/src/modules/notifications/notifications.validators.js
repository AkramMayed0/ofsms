/**
 * notifications.validators.js
 * Validation rules for the notifications module.
 */

const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerTokenRules = [
  body('token').notEmpty().withMessage('FCM token مطلوب'),
  validateRequest,
];

const unregisterTokenRules = [
  body('token').notEmpty().withMessage('FCM token مطلوب'),
  validateRequest,
];

const broadcastRules = [
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
  validateRequest,
];

module.exports = {
  registerTokenRules,
  unregisterTokenRules,
  broadcastRules,
};

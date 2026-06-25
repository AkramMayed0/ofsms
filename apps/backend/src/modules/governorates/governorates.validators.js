/**
 * governorates.validators.js
 * Declarative validation rules and formatting for the governorates module.
 */

const { param, validationResult } = require('express-validator');

/**
 * Standard request validation checker.
 * Returns a 400 response with the first validation error message.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const getOrphansByGovernorateRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('معرّف المحافظة غير صحيح ويجب أن يكون رقماً صحيحاً موجباً'),
  validateRequest,
];

module.exports = {
  getOrphansByGovernorateRules,
  validateRequest,
};

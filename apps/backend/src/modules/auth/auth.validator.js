/**
 * auth.validator.js — OFSMS Auth Input Validation
 *
 * Provides express-validator rule chains for each auth endpoint.
 * Usage: apply as middleware before the route handler.
 *
 * All error messages are in Arabic per project convention.
 */

const { body, validationResult } = require('express-validator');

// ── Shared: run validation and return 400 on failure ─────────────────────────

/**
 * Middleware to evaluate accumulated validation errors.
 * Place this AFTER the validation rule chain in the route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error message only, for a consistent UX
    const firstError = errors.array({ onlyFirstError: true })[0];
    return res.status(400).json({ error: firstError.msg });
  }
  next();
};

// ── Login validation rules ────────────────────────────────────────────────────

const loginValidation = [
  body('email')
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('صيغة البريد الإلكتروني غير صحيحة')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),

  validate,
];

module.exports = {
  loginValidation,
  validate,
};

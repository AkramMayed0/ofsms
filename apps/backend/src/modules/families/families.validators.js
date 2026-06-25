/**
 * families.validators.js
 * Validation rules and error formatting for the families module.
 */

const { body, validationResult } = require('express-validator');

// Shared middleware to format validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error message to match our standard 400 response format
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const createFamilyRules = [
  body('familyName')
    .trim()
    .notEmpty().withMessage('اسم الأسرة مطلوب')
    .isLength({ min: 3 }).withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('headOfFamily')
    .trim()
    .notEmpty().withMessage('اسم رب الأسرة مطلوب'),
  body('memberCount')
    .isInt({ min: 1 }).withMessage('عدد الأفراد يجب أن يكون 1 على الأقل'),
  body('governorateId')
    .isInt({ min: 1 }).withMessage('المحافظة مطلوبة'),
  validateRequest,
];

const updateFamilyRules = [
  body('familyName')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('headOfFamily')
    .optional()
    .trim()
    .notEmpty().withMessage('اسم رب الأسرة لا يمكن أن يكون فارغاً'),
  body('memberCount')
    .optional()
    .isInt({ min: 1 }).withMessage('عدد الأفراد يجب أن يكون 1 على الأقل'),
  body('governorateId')
    .optional()
    .isInt({ min: 1 }).withMessage('المحافظة مطلوبة (رقم صحيح)'),
  validateRequest,
];

const updateStatusRules = [
  body('status')
    .isIn(['under_marketing', 'under_sponsorship', 'rejected', 'inactive'])
    .withMessage('حالة غير صحيحة'),
  body('notes')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('ملاحظات الرفض مطلوبة'),
  validateRequest,
];

module.exports = {
  createFamilyRules,
  updateFamilyRules,
  updateStatusRules,
};

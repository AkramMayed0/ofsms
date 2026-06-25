/**
 * sponsors.validators.js
 * Declarative validation rules and formatting for the sponsors and sponsor portal modules.
 */

const { body, validationResult } = require('express-validator');

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

const createSponsorRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('اسم الكافل مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم يجب أن يكون 3 أحرف على الأقل')
    .matches(/^[\p{L}\s'-]+$/u)
    .withMessage('الاسم يجب أن يحتوي على أحرف فقط ولا يمكن أن يحتوي على أرقام'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صحيح'),
  body('portalPassword')
    .notEmpty()
    .withMessage('كلمة مرور البوابة مطلوبة')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  validateRequest,
];

const updateSponsorRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('اسم الكافل مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم يجب أن يكون 3 أحرف على الأقل')
    .matches(/^[\p{L}\s'-]+$/u)
    .withMessage('الاسم يجب أن يحتوي على أحرف فقط ولا يمكن أن يحتوي على أرقام'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صحيح'),
  body('portalPassword')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  validateRequest,
];

const createSponsorshipRules = [
  body('beneficiaryType')
    .isIn(['orphan', 'family'])
    .withMessage('نوع المستفيد يجب أن يكون orphan أو family'),
  body('beneficiaryId')
    .isUUID()
    .withMessage('معرّف المستفيد غير صحيح'),
  body('agentId')
    .isUUID()
    .withMessage('معرّف المندوب غير صحيح'),
  body('startDate')
    .isDate()
    .withMessage('تاريخ البداية غير صحيح'),
  body('monthlyAmount')
    .isFloat({ min: 1 })
    .withMessage('المبلغ الشهري يجب أن يكون أكبر من صفر'),
  validateRequest,
];

const transferSponsorshipRules = [
  body('beneficiaryType')
    .isIn(['orphan', 'family'])
    .withMessage('نوع المستفيد غير صحيح'),
  body('beneficiaryId')
    .isUUID()
    .withMessage('معرّف المستفيد غير صحيح'),
  body('newSponsorId')
    .isUUID()
    .withMessage('معرّف الكافل الجديد غير صحيح'),
  body('agentId')
    .isUUID()
    .withMessage('معرّف المندوب غير صحيح'),
  body('monthlyAmount')
    .isFloat({ min: 1 })
    .withMessage('المبلغ الشهري يجب أن يكون أكبر من صفر'),
  validateRequest,
];

const sponsorLoginRules = [
  body('portalToken').notEmpty().withMessage('رمز البوابة مطلوب'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
  validateRequest,
];

module.exports = {
  createSponsorRules,
  updateSponsorRules,
  createSponsorshipRules,
  transferSponsorshipRules,
  sponsorLoginRules,
  validateRequest,
};

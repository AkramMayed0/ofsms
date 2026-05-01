/**
 * sponsors.routes.js
 * Mounted at: /api/sponsors
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./sponsors.controller');
const { query } = require('../../config/db');

const router = Router();

// ── Validation rules ──────────────────────────────────────────

const createSponsorRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('اسم الكافل مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),
  body('phone')
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صحيح'),
  body('portalPassword')
    .notEmpty()
    .withMessage('كلمة مرور البوابة مطلوبة')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
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
];

const transferSponsorshipRules = [
  body('beneficiaryType').isIn(['orphan', 'family']),
  body('beneficiaryId').isUUID(),
  body('newSponsorId').isUUID().withMessage('معرّف الكافل الجديد غير صحيح'),
  body('agentId').isUUID(),
  body('monthlyAmount').isFloat({ min: 1 }),
];

// ── Routes ────────────────────────────────────────────────────

// GM only: list all sponsors
router.get(
  '/',
  authenticate,
  authorize('gm'),
  controller.getAllSponsors
);

// GM only: create a new sponsor
router.post(
  '/',
  authenticate,
  authorize('gm'),
  createSponsorRules,
  controller.createSponsor
);

// GM only: transfer a beneficiary between sponsors
router.post(
  '/transfer',
  authenticate,
  authorize('gm'),
  transferSponsorshipRules,
  controller.transferSponsorship
);

// GM only: get a single sponsor + their sponsorships
router.get(
  '/:id',
  authenticate,
  authorize('gm'),
  controller.getSponsorById
);

// GM only: assign a beneficiary to a sponsor
router.post(
  '/:id/sponsorships',
  authenticate,
  authorize('gm'),
  createSponsorshipRules,
  controller.createSponsorship
);

/**
 * GET /api/sponsors/:id/portfolio
 * GM only — full portfolio view for a sponsor.
 * Returns all active + historical sponsorships with beneficiary details,
 * agent info, amounts, and latest Quran report per orphan.
 * Covers SADD FR-043.
 */
router.get(
  '/:id/portfolio',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      // Verify sponsor exists
      const { rows: sponsorRows } = await query(
        `SELECT id, full_name, phone, email, portal_token, created_at
         FROM sponsors WHERE id = $1`,
        [req.params.id]
      );
      if (!sponsorRows[0]) {
        return res.status(404).json({ error: 'الكافل غير موجود' });
      }

      // All sponsorships (active + historical) with full beneficiary details
      const { rows: sponsorships } = await query(
        `SELECT
           sp.id                  AS sponsorship_id,
           sp.beneficiary_type,
           sp.beneficiary_id,
           sp.monthly_amount,
           sp.start_date,
           sp.end_date,
           sp.is_active,
           sp.intermediary,
           sp.end_reason,
           -- Beneficiary name (orphan or family)
           COALESCE(o.full_name, f.family_name)   AS beneficiary_name,
           -- Governorate
           COALESCE(go.name_ar,  gf.name_ar)      AS governorate_ar,
           -- Agent
           COALESCE(uo.full_name, uf.full_name)   AS agent_name,
           COALESCE(uo.id,        uf.id)           AS agent_id,
           -- Orphan-specific fields
           o.date_of_birth,
           o.gender,
           o.status                               AS beneficiary_status,
           o.is_gifted,
           -- Latest Quran report (orphans only)
           qr.status        AS latest_report_status,
           qr.month         AS latest_report_month,
           qr.year          AS latest_report_year,
           qr.juz_memorized AS latest_juz_memorized
         FROM sponsorships sp
         LEFT JOIN orphans   o  ON o.id  = sp.beneficiary_id AND sp.beneficiary_type = 'orphan'
         LEFT JOIN families  f  ON f.id  = sp.beneficiary_id AND sp.beneficiary_type = 'family'
         LEFT JOIN governorates go ON go.id = o.governorate_id
         LEFT JOIN governorates gf ON gf.id = f.governorate_id
         LEFT JOIN users uo ON uo.id = o.agent_id
         LEFT JOIN users uf ON uf.id = f.agent_id
         LEFT JOIN LATERAL (
           SELECT status, month, year, juz_memorized
           FROM quran_reports
           WHERE orphan_id = sp.beneficiary_id
           ORDER BY year DESC, month DESC
           LIMIT 1
         ) qr ON sp.beneficiary_type = 'orphan'
         WHERE sp.sponsor_id = $1
         ORDER BY sp.is_active DESC, sp.start_date DESC`,
        [req.params.id]
      );

      // Build summary
      const active    = sponsorships.filter(s => s.is_active);
      const historical = sponsorships.filter(s => !s.is_active);

      const summary = {
        total_sponsorships:        sponsorships.length,
        active_sponsorships:       active.length,
        historical_sponsorships:   historical.length,
        total_monthly_amount:      active.reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0),
        orphans_count:             active.filter(s => s.beneficiary_type === 'orphan').length,
        families_count:            active.filter(s => s.beneficiary_type === 'family').length,
        gifted_count:              active.filter(s => s.is_gifted).length,
      };

      return res.json({
        sponsor:      sponsorRows[0],
        summary,
        active:       active,
        historical:   historical,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

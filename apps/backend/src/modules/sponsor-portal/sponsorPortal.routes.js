/**
 * sponsorPortal.routes.js
 * Mounted at: /api/sponsor
 *
 * POST /api/sponsor/login   → authenticate with portal_token + password
 * GET  /api/sponsor/me      → return current sponsor info (auth required)
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../../config/db');
const { generateSponsorToken, authenticateSponsor } = require('../../middleware/sponsorAuth');

const router = Router();

// ── POST /api/sponsor/login ───────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('portalToken').notEmpty().withMessage('رمز البوابة مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { portalToken, password } = req.body;

      // Look up sponsor by portal_token
      const { rows } = await query(
        `SELECT id, full_name, email, portal_token, portal_password_hash
         FROM sponsors
         WHERE portal_token = $1`,
        [portalToken]
      );

      const sponsor = rows[0];

      // Use a consistent error message (no enumeration)
      if (!sponsor) {
        return res.status(401).json({ error: 'رمز البوابة أو كلمة المرور غير صحيحة' });
      }

      const passwordMatch = await bcrypt.compare(password, sponsor.portal_password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'رمز البوابة أو كلمة المرور غير صحيحة' });
      }

      const accessToken = generateSponsorToken(sponsor);

      return res.json({
        accessToken,
        sponsor: {
          id: sponsor.id,
          name: sponsor.full_name,
          email: sponsor.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/sponsor/me ───────────────────────────────────────────────────────
router.get('/me', authenticateSponsor, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, created_at FROM sponsors WHERE id = $1`,
      [req.sponsor.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'الكافل غير موجود' });
    }

    return res.json({ sponsor: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sponsor/orphans ──────────────────────────────────────────────────
// Returns the sponsor's active sponsored orphans — selected fields only (FR-034, FR-037)
router.get('/orphans', authenticateSponsor, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         o.id,
         o.full_name,
         o.gender,
         o.is_gifted,
         o.status,
         g.name_ar   AS governorate_ar,
         sp.monthly_amount,
         sp.start_date AS sponsorship_start,
         u.full_name  AS agent_name
       FROM sponsorships sp
       JOIN orphans o       ON o.id  = sp.beneficiary_id
       JOIN governorates g  ON g.id  = o.governorate_id
       JOIN users u         ON u.id  = o.agent_id
       WHERE sp.sponsor_id      = $1
         AND sp.beneficiary_type = 'orphan'
         AND sp.is_active        = TRUE
       ORDER BY sp.start_date DESC`,
      [req.sponsor.id]
    );

    return res.json({ orphans: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sponsor/reports/:orphanId ────────────────────────────────────────
// Returns Quran reports + disbursement receipts for one orphan (FR-035)
// Sponsor can only access orphans they sponsor — ownership check enforced
router.get('/reports/:orphanId', authenticateSponsor, async (req, res, next) => {
  try {
    const { orphanId } = req.params;

    // Ownership check: verify this orphan belongs to this sponsor
    const { rows: ownerCheck } = await query(
      `SELECT id FROM sponsorships
       WHERE sponsor_id      = $1
         AND beneficiary_id   = $2
         AND beneficiary_type = 'orphan'
         AND is_active        = TRUE`,
      [req.sponsor.id, orphanId]
    );

    if (!ownerCheck.length) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى بيانات هذا اليتيم' });
    }

    // Quran reports
    const { rows: quranReports } = await query(
      `SELECT
         qr.id,
         qr.month,
         qr.year,
         qr.juz_memorized,
         qr.status,
         qr.submitted_at,
         qr.supervisor_notes
       FROM quran_reports qr
       WHERE qr.orphan_id = $1
       ORDER BY qr.year DESC, qr.month DESC`,
      [orphanId]
    );

    // Disbursement receipts (confirmed payments)
    const { rows: disbursements } = await query(
      `SELECT
         di.amount,
         di.included,
         di.exclusion_reason,
         dl.month,
         dl.year,
         dl.status  AS list_status,
         br.confirmed_at AS receipt_confirmed_at
       FROM disbursement_items di
       JOIN disbursement_lists dl ON dl.id  = di.list_id
       LEFT JOIN biometric_receipts br ON br.item_id = di.id
       WHERE di.orphan_id = $1
       ORDER BY dl.year DESC, dl.month DESC`,
      [orphanId]
    );

    return res.json({
      orphan_id: orphanId,
      quran_reports: quranReports,
      disbursements,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
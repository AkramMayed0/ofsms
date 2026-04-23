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

module.exports = router;
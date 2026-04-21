const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { authenticate } = require('../../middleware/rbac');

/**
 * GET /api/governorates
 * Returns all governorates (id, name_ar, name_en).
 * Accessible by all authenticated roles.
 * Used to populate dropdowns in registration forms.
 */
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name_ar, name_en FROM governorates ORDER BY id ASC'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

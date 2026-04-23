/**
 * sponsorAuth.js — Auth middleware for the sponsor portal
 *
 * Sponsors authenticate via their unique portal_token + password.
 * They receive a sponsor-scoped JWT (role: 'sponsor').
 * This middleware is used exclusively on /api/sponsor/* routes.
 */

const jwt = require('jsonwebtoken');

const SPONSOR_SECRET = process.env.JWT_SPONSOR_SECRET || process.env.JWT_SECRET;

/**
 * Generate a sponsor-scoped access token.
 * @param {{ id: string, full_name: string }} sponsor
 */
const generateSponsorToken = (sponsor) => {
  return jwt.sign(
    { id: sponsor.id, name: sponsor.full_name, role: 'sponsor' },
    SPONSOR_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Middleware: verify sponsor JWT on protected /api/sponsor/* routes.
 * Attaches req.sponsor = { id, name, role }
 */
const authenticateSponsor = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'رمز المصادقة مطلوب' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SPONSOR_SECRET);

    if (decoded.role !== 'sponsor') {
      return res.status(403).json({ error: 'هذه البوابة مخصصة للكفلاء فقط' });
    }

    req.sponsor = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'رمز المصادقة غير صالح', code: 'TOKEN_INVALID' });
  }
};

module.exports = { generateSponsorToken, authenticateSponsor };
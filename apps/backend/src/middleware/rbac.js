/**
 * rbac.js — OFSMS Authentication & Authorization Middleware
 *
 * Provides:
 *   authenticate      — verifies access JWT, attaches req.user
 *   authorize(...roles) — restricts route to specific roles
 *   generateTokens    — issues access + refresh token pair
 *   refreshAccessToken — rotates refresh token, issues new access token
 *
 * Token strategy:
 *   Access token  : JWT, expires in 30 min (resets on each request → idle expiry)
 *   Refresh token : JWT, expires in 7 days (stored client-side in httpOnly cookie)
 *
 * Roles: agent | supervisor | finance | gm | sponsor
 */

const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRY  = '30m';   // idle session: client must refresh within 30 min of last activity
const REFRESH_EXPIRY = '7d';    // absolute session: user must re-login after 7 days

// ── Token generation ──────────────────────────────────────────────────────────

/**
 * Generate a matched access + refresh token pair.
 * @param {{ id: string, role: string, name: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });

  const refreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });

  return { accessToken, refreshToken };
};

// ── Authenticate middleware ───────────────────────────────────────────────────

/**
 * Verify the Bearer access token on every protected request.
 * On success: attaches req.user = { id, role, name, iat, exp }
 * On failure: 401 with Arabic error message
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'رمز المصادقة مطلوب' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'رمز المصادقة غير صالح', code: 'TOKEN_INVALID' });
  }
};

// ── Authorize middleware ──────────────────────────────────────────────────────

/**
 * Restrict a route to one or more roles.
 * Must be used AFTER authenticate.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('gm'), handler)
 *   router.post('/report', authenticate, authorize('agent', 'supervisor'), handler)
 *
 * @param  {...string} roles
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصادَق' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }
    next();
  };

// ── Refresh token handler ─────────────────────────────────────────────────────

/**
 * Verify a refresh token and issue a new access token.
 * Call this from POST /api/auth/refresh route.
 *
 * Expects: req.body.refreshToken OR req.cookies.refreshToken
 * Returns: { accessToken }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function} getUserById - async (id) => user row from DB
 */
const refreshAccessToken = (getUserById) => async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'رمز التحديث مطلوب' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    // Re-fetch user from DB to ensure they are still active
    const user = await getUserById(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'الحساب غير نشط أو غير موجود' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id:   user.id,
      role: user.role,
      name: user.full_name,
    });

    // Rotate the refresh token (invalidate old one by issuing new)
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return res.json({ accessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً', code: 'REFRESH_EXPIRED' });
    }
    return res.status(401).json({ error: 'رمز التحديث غير صالح', code: 'REFRESH_INVALID' });
  }
};

module.exports = { authenticate, authorize, generateTokens, refreshAccessToken };

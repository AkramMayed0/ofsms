/**
 * auth.controller.js — OFSMS Auth HTTP Handler Layer
 *
 * Responsible only for:
 *   - Reading from req (body, cookies, user)
 *   - Calling the service layer
 *   - Writing the HTTP response (status + JSON)
 *
 * No business logic lives here.
 * Errors from the service are caught and mapped to HTTP status codes.
 */

const { login, getProfile, buildCookieOptions } = require('./auth.service');

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await login(email, password);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, buildCookieOptions());

    return res.json({ accessToken, user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
const handleLogout = (req, res) => {
  const opts = buildCookieOptions();
  // Remove maxAge for clearCookie (not needed, can cause issues in some clients)
  delete opts.maxAge;
  res.clearCookie('refreshToken', opts);
  return res.json({ message: 'تم تسجيل الخروج بنجاح' });
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const handleMe = async (req, res, next) => {
  try {
    const user = await getProfile(req.user.id);
    return res.json({ user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

module.exports = {
  handleLogin,
  handleLogout,
  handleMe,
};

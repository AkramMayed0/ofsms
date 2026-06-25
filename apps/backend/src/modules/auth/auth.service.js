/**
 * auth.service.js — OFSMS Auth Business Logic Layer
 *
 * Orchestrates authentication operations by combining:
 *   - auth.repository.js  (data access)
 *   - rbac.js             (token generation)
 *   - bcryptjs            (password verification)
 *
 * No HTTP knowledge lives here (no req/res/next).
 * All functions throw plain Errors with a .statusCode property
 * that the controller maps to the correct HTTP status code.
 */

const bcrypt = require('bcryptjs');
const { generateTokens } = require('../../middleware/rbac');
const { findUserByEmail, findUserById, findUserProfileById } = require('./auth.repository');

// ── Cookie config factory ─────────────────────────────────────────────────────
// Single source of truth for refresh-token cookie options.
const buildCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Validate credentials and issue a token pair.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 * @throws {Error} with .statusCode attached
 */
const login = async (email, password) => {
  // 1. Fetch user from DB
  const user = await findUserByEmail(email);

  // 2. User not found — same message as wrong password (prevents user enumeration)
  if (!user) {
    const err = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    err.statusCode = 401;
    throw err;
  }

  // 3. Account must be active
  if (!user.is_active) {
    const err = new Error('الحساب موقوف. تواصل مع المدير العام');
    err.statusCode = 403;
    throw err;
  }

  // 4. Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    err.statusCode = 401;
    throw err;
  }

  // 5. Issue token pair
  const { accessToken, refreshToken } = generateTokens({
    id:   user.id,
    role: user.role,
    name: user.full_name,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id:    user.id,
      name:  user.full_name,
      email: user.email,
      role:  user.role,
    },
  };
};

// ── Get current user profile ──────────────────────────────────────────────────

/**
 * Fetch the public profile for an authenticated user.
 *
 * @param {string} userId
 * @returns {object} user profile row
 * @throws {Error} with .statusCode = 404 if not found
 */
const getProfile = async (userId) => {
  const user = await findUserProfileById(userId);
  if (!user) {
    const err = new Error('المستخدم غير موجود');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

module.exports = {
  login,
  getProfile,
  findUserById,       // re-exported for use in refreshAccessToken delegation
  buildCookieOptions,
};

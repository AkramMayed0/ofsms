/**
 * auth.routes.js — OFSMS Authentication Endpoints
 *
 * POST /api/auth/login    → validate credentials, return access token + set refresh cookie
 * POST /api/auth/refresh  → rotate refresh token, return new access token
 * POST /api/auth/logout   → clear refresh token cookie
 * GET  /api/auth/me       → return current user info from token
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');
const { generateTokens, refreshAccessToken, authenticate } = require('../../middleware/rbac');

// ── Helper: fetch user by ID (used by refreshAccessToken) ────────────────────
const getUserById = async (id) => {
  const { rows } = await query(
    'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

// ── Helper: set refresh token as httpOnly cookie ─────────────────────────────
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    // 2. Look up user by email
    const { rows } = await query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];

    // 3. User not found — use same error message as wrong password (security: no enumeration)
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // 4. Check account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'الحساب موقوف. تواصل مع المدير العام' });
    }

    // 5. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // 6. Issue tokens
    const { accessToken, refreshToken } = generateTokens({
      id:   user.id,
      role: user.role,
      name: user.full_name,
    });

    // 7. Set refresh token in httpOnly cookie
    setRefreshCookie(res, refreshToken);

    // 8. Return access token + user info (never return password_hash)
    return res.json({
      accessToken,
      user: {
        id:   user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
// Delegates entirely to rbac.refreshAccessToken
// It reads req.cookies.refreshToken OR req.body.refreshToken
router.post('/refresh', refreshAccessToken(getUserById));

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the current authenticated user's info
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, full_name, email, role, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

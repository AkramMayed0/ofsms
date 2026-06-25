/**
 * auth.repository.js — OFSMS Auth Database Access Layer
 *
 * Centralises all SQL queries related to user authentication.
 * No business logic lives here — only raw data access.
 *
 * All functions return plain objects or null.
 */

const { query } = require('../../config/db');

// ── Find user for login (includes password_hash for verification) ─────────────
const findUserByEmail = async (email) => {
  const { rows } = await query(
    'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
};

// ── Find user by ID (used by refresh token rotation) ─────────────────────────
const findUserById = async (id) => {
  const { rows } = await query(
    'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

// ── Find user profile (no password_hash, includes phone) ─────────────────────
const findUserProfileById = async (id) => {
  const { rows } = await query(
    'SELECT id, full_name, email, role, phone, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

module.exports = {
  findUserByEmail,
  findUserById,
  findUserProfileById,
};

/**
 * auth.routes.js — OFSMS Authentication Endpoints
 *
 * POST /api/auth/login    → validate credentials, return access token + set refresh cookie
 * POST /api/auth/refresh  → rotate refresh token, return new access token
 * POST /api/auth/logout   → clear refresh token cookie
 * GET  /api/auth/me       → return current user info from token
 *
 * This file contains ONLY route definitions and middleware wiring.
 * Business logic  → auth.service.js
 * HTTP handling   → auth.controller.js
 * DB queries      → auth.repository.js
 * Validation      → auth.validator.js
 */

const express = require('express');
const router = express.Router();

const { refreshAccessToken, authenticate } = require('../../middleware/rbac');
const { loginValidation } = require('./auth.validator');
const { handleLogin, handleLogout, handleMe } = require('./auth.controller');
const { findUserById } = require('./auth.service');

// POST /api/auth/login
router.post('/login', loginValidation, handleLogin);

// POST /api/auth/refresh
router.post('/refresh', refreshAccessToken(findUserById));

// POST /api/auth/logout
router.post('/logout', handleLogout);

// GET /api/auth/me
router.get('/me', authenticate, handleMe);

module.exports = router;

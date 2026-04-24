/**
 * security.js — OFSMS Hardened Security Middleware
 *
 * Applies:
 *   1. helmet() with strict configuration (HSTS, CSP, X-Frame-Options, etc.)
 *   2. HTTP → HTTPS redirect (production only, when FORCE_HTTPS=true)
 *   3. Trust proxy settings (required when behind Nginx/ALB)
 *
 * Usage in index.js:
 *   const { applySecurityMiddleware } = require('./middleware/security');
 *   applySecurityMiddleware(app);
 *
 * SADD §5 requirements covered:
 *   ✅ TLS 1.2+ during transport (enforced at Nginx level, HSTS locks it client-side)
 *   ✅ AES-256 for data at rest (handled at DB/S3 level — not Express)
 *   ✅ HSTS header
 *   ✅ Role-based access (rbac.js)
 *   ✅ Audit log (audit_logs table)
 */

const helmet = require('helmet');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FORCE_HTTPS   = process.env.FORCE_HTTPS === 'true';

/**
 * HTTP → HTTPS redirect middleware.
 * Only active when FORCE_HTTPS=true (i.e. in production behind Nginx).
 * Skipped entirely in development so localhost still works on HTTP.
 */
const httpsRedirect = (req, res, next) => {
  if (!FORCE_HTTPS) return next();

  // req.secure is set correctly when app.set('trust proxy', 1) is configured
  if (req.secure) return next();

  // Redirect to HTTPS preserving the original URL
  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
};

/**
 * Helmet configuration — applied to every response.
 *
 * Key decisions:
 * - HSTS maxAge: 1 year (31536000s) with includeSubDomains
 *   → Once a browser sees this, it will ONLY connect via HTTPS for 1 year
 * - CSP: permissive for API (no HTML served) but blocks everything by default
 *   → Frontend (Next.js) has its own CSP via next.config.js headers
 * - X-Frame-Options DENY: prevents clickjacking
 * - referrerPolicy strict-origin-when-cross-origin: limits referrer leakage
 */
const helmetConfig = helmet({
  // ── HSTS (HTTP Strict Transport Security) ─────────────────────────────────
  // Tells browsers: "Only connect to this domain over HTTPS for 1 year"
  strictTransportSecurity: IS_PRODUCTION
    ? {
        maxAge:            31536000,   // 1 year in seconds
        includeSubDomains: true,
        preload:           true,       // eligible for browser HSTS preload lists
      }
    : false, // disabled in dev so HTTP localhost still works

  // ── Content Security Policy ───────────────────────────────────────────────
  // This is an API — no HTML rendered. Block everything by default.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc:  ["'none'"],
      styleSrc:   ["'none'"],
      imgSrc:     ["'none'"],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },

  // ── Other headers ─────────────────────────────────────────────────────────
  crossOriginEmbedderPolicy: false,   // not needed for API
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  xFrameOptions:             { action: 'deny' },
  xContentTypeOptions:       true,    // X-Content-Type-Options: nosniff
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
  xPoweredBy:                false,   // removes X-Powered-By: Express header
  dnsPrefetchControl:        { allow: false },
});

/**
 * Apply all security middleware to the Express app.
 * Call this BEFORE routes, AFTER app.set('trust proxy').
 *
 * @param {import('express').Application} app
 */
const applySecurityMiddleware = (app) => {
  // Trust the first proxy (Nginx) so req.secure and req.ip work correctly
  // Only enable in production — in dev this can expose localhost to issues
  if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  app.use(httpsRedirect);
  app.use(helmetConfig);
};

module.exports = { applySecurityMiddleware };

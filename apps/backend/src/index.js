require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// ── Firebase: initialize before any route that may send notifications ─────────
require('./config/firebase');

// ── Scheduler: register monthly cron jobs ────────────────────────────────────
const { initScheduler } = require('./scheduler');

// ── Security middleware (helmet + HSTS + HTTPS redirect) ─────────────────────
const { applySecurityMiddleware } = require('./middleware/security');

const app = express();
app.set('etag', false); // ← add this
const PORT = process.env.PORT || 4000;

// ── Security (must come before routes and other middleware) ───────────────────
applySecurityMiddleware(app);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:         process.env.FRONTEND_URL,
  credentials:    true,
  methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing & logging ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./modules/auth/auth.routes'));
app.use('/api/orphans',      require('./modules/orphans/orphans.routes'));
app.use('/api/families',     require('./modules/families/families.routes'));
app.use('/api/sponsors',     require('./modules/sponsors/sponsors.routes'));
app.use('/api/sponsor',      require('./modules/sponsor-portal/sponsorPortal.routes'));
app.use('/api/governorates', require('./modules/governorates/governorates.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/audit-logs', require('./modules/users/users.routes'));
app.use('/api/quran-reports', require('./modules/quran/quranReports.routes'));
app.use('/api/disbursements', require('./modules/disbursements/disbursements.routes'));
app.use('/api/receipts', require('./modules/receipts/receipts.routes'));
// app.use('/api/announcements',  require('./modules/announcements/announcements.routes'));
// app.use('/api/reports',        require('./modules/reports/reports.routes'));
app.use('/api/users',          require('./modules/users/users.routes'));
// In apps/backend/src/index.js — add this line with the other routes
app.use('/api/supervisor', require('./modules/supervisor/supervisor.routes'));
// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'خطأ داخلي في الخادم',
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ OFSMS backend running on port ${PORT}`);
  initScheduler();
});

module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & middleware ──────────────────────────────────────────────────
app.use(helmet());https://github.com/AkramMayed0/ofsms/pull/9/conflict?name=apps%252Fbackend%252Fsrc%252Findex.js&ancestor_oid=ea166128e3664e251478a7cbe9dc3a855181e202&base_oid=1d3676f26945b22674a210ec58d89826089b0b93&head_oid=4e3691548425bf8fafdc2ae6f174e94d0b6ee6da
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const cookieParser = require('cookie-parser');
app.use(cookieParser()); // add this before routes

// ── Routes (to be wired in later tasks) ───────────────────────────────────
app.use('/api/auth', require('./modules/auth/auth.routes'));
// app.use('/api/orphans',       require('./modules/orphans/orphans.routes'));
app.use('/api/families',      require('./modules/families/families.routes'));
// app.use('/api/quran-reports', require('./modules/quran/quran.routes'));
// app.use('/api/disbursements', require('./modules/disbursements/disbursements.routes'));
// app.use('/api/receipts',      require('./modules/receipts/receipts.routes'));
app.use('/api/sponsors',      require('./modules/sponsors/sponsors.routes'));
// app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
// app.use('/api/announcements', require('./modules/announcements/announcements.routes'));
// app.use('/api/reports',       require('./modules/reports/reports.routes'));
// app.use('/api/users',         require('./modules/users/users.routes'));
app.use('/api/governorates',  require('./modules/governorates/governorates.routes'));

// ── Global error handler ──────────────────────────────────────────────────
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
});

module.exports = app;

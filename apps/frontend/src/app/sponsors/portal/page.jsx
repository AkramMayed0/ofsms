'use client';

/**
 * apps/frontend/src/app/sponsor/portal/page.jsx
 * Route: /sponsor/portal?token=<portal_token>   (PUBLIC — no staff auth needed)
 *
 * Two views:
 *   1. Login form  — sponsor enters their password (token comes from URL)
 *   2. Dashboard   — sponsor sees their orphans, reports, announcements
 *
 * API calls:
 *   POST /api/sponsor/login          → { accessToken, sponsor }
 *   GET  /api/sponsor/me             → sponsor details
 *   GET  /api/sponsor/orphans        → list of sponsored orphans
 *   GET  /api/sponsor/reports/:id    → orphan detail reports
 *   GET  /api/announcements          → active announcements
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

// ── Axios instance for sponsor portal (no Zustand, uses its own token) ────────
const sponsorApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' })
    : '—';

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

const QURAN_STATUS = {
  approved: { label: 'معتمد',       color: '#10b981', bg: '#ecfdf5' },
  rejected: { label: 'مرفوض',       color: '#ef4444', bg: '#fef2f2' },
  pending:  { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fffbeb' },
};

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginView({ token, onLogin }) {
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError('كلمة المرور مطلوبة'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await sponsorApi.post('/sponsor/login', {
        portalToken: token,
        password,
      });
      onLogin(data.accessToken, data.sponsor);
    } catch (err) {
      setError(err.response?.data?.error || 'رمز البوابة أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root" dir="rtl">
      {/* Brand panel */}
      <aside className="brand-panel">
        <div className="brand-pattern">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="dot" style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
          ))}
        </div>
        <div className="brand-content">
          <div className="shield">🛡️</div>
          <h1 className="brand-title">بوابة الكفلاء</h1>
          <p className="brand-sub">
            Orphan &amp; Family Sponsorship<br />Management System
          </p>
          <div className="brand-divider" />
          <p className="brand-tagline">شفافية · رعاية · أثر</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="form-panel">
        <div className="form-card">
          <div className="form-logo">🤝</div>
          <h2 className="form-title">تسجيل دخول الكافل</h2>
          <p className="form-hint">أدخل كلمة المرور للوصول إلى محفظة كفالاتك</p>

          {!token && (
            <div className="err-box">
              ⚠ رابط البوابة غير صحيح. يرجى استخدام الرابط المُرسَل إليك.
            </div>
          )}

          {token && (
            <form onSubmit={handleSubmit} className="form" noValidate>
              {error && <div className="err-box">{error}</div>}

              <div className="field">
                <label className="lbl">كلمة المرور</label>
                <input
                  type="password"
                  className="inp"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading || !token}>
                {loading ? <><span className="spin" /> جارٍ التحقق…</> : 'دخول إلى البوابة ←'}
              </button>
            </form>
          )}

          <p className="form-footer">مؤسسة الأرض الطيبة · نظام كفالة الأيتام</p>
        </div>
      </main>

      <style jsx>{`
        .login-root { display:flex; flex-direction:row-reverse; min-height:100vh; background:#f0f4f8; font-family:'Cairo','Tajawal',sans-serif; }

        .brand-panel { position:relative; width:42%; background:linear-gradient(160deg,#0d3d5c 0%,#1B5E8C 55%,#1a7a6e 100%); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
        .brand-pattern { position:absolute; inset:0; }
        .dot { position:absolute; width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.12); animation:pulse 3s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        .brand-content { position:relative; z-index:2; text-align:center; color:#fff; padding:2rem; }
        .shield { font-size:3.5rem; margin-bottom:1rem; display:block; }
        .brand-title { font-size:2rem; font-weight:700; margin:0 0 .5rem; text-shadow:0 2px 16px rgba(0,0,0,.18); }
        .brand-sub { font-size:.75rem; color:rgba(255,255,255,.6); letter-spacing:.08em; text-transform:uppercase; margin:0 0 1.5rem; line-height:1.8; }
        .brand-divider { width:40px; height:2px; background:rgba(255,255,255,.3); margin:0 auto 1.25rem; border-radius:1px; }
        .brand-tagline { font-size:.9rem; font-weight:500; color:rgba(255,255,255,.8); letter-spacing:.15em; margin:0; }

        .form-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem 1.5rem; }
        .form-card { width:100%; max-width:400px; background:#fff; border-radius:1.25rem; padding:2.5rem 2rem; box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 24px rgba(27,94,140,.09); border:1px solid rgba(27,94,140,.08); text-align:center; }
        .form-logo { font-size:2.5rem; margin-bottom:1rem; }
        .form-title { font-size:1.4rem; font-weight:700; color:#0d3d5c; margin:0 0 .3rem; }
        .form-hint { font-size:.83rem; color:#6b7a8d; margin:0 0 1.75rem; line-height:1.6; }

        .form { display:flex; flex-direction:column; gap:1rem; text-align:right; }
        .field { display:flex; flex-direction:column; gap:.35rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .inp { border:1.5px solid #d1d5db; border-radius:.75rem; padding:.7rem .9rem; font-size:.9rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; direction:ltr; text-align:left; }
        .inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.12); }

        .err-box { background:#fef2f2; border:1px solid #fecaca; border-radius:.625rem; padding:.65rem .85rem; font-size:.82rem; color:#b91c1c; font-weight:500; text-align:right; margin-bottom:.5rem; }

        .btn-submit { display:flex; align-items:center; justify-content:center; gap:.5rem; width:100%; padding:.8rem 1.5rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.95rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:all .15s; box-shadow:0 2px 8px rgba(27,94,140,.28); }
        .btn-submit:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .btn-submit:disabled { opacity:.65; cursor:not-allowed; }

        .form-footer { font-size:.72rem; color:#9ca3af; margin:1.5rem 0 0; }

        .spin { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        @media (max-width:768px) {
          .login-root { flex-direction:column; }
          .brand-panel { width:100%; min-height:160px; padding:1.5rem; }
          .brand-title { font-size:1.4rem; }
        }
      `}</style>
    </div>
  );
}

// ── Orphan Detail Modal ───────────────────────────────────────────────────────
function OrphanDetailModal({ orphanId, orphanName, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sponsorApi
      .get(`/sponsor/reports/${orphanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orphanId, token]);

  const quranReports  = data?.quran_reports  || [];
  const disbursements = data?.disbursements  || [];

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        <div className="modal-head">
          <h3 className="modal-title">تقارير — {orphanName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-state">⏳ جارٍ التحميل…</div>
          ) : !data ? (
            <div className="empty-state">تعذّر تحميل البيانات</div>
          ) : (
            <>
              {/* Quran reports */}
              <h4 className="section-title">📖 تقارير حفظ القرآن</h4>
              {quranReports.length === 0 ? (
                <p className="empty-text">لا توجد تقارير بعد</p>
              ) : (
                <div className="report-list">
                  {quranReports.map((r) => {
                    const cfg = QURAN_STATUS[r.status] || QURAN_STATUS.pending;
                    return (
                      <div key={r.id} className="report-row">
                        <div className="report-period">{r.month}/{r.year}</div>
                        <div className="report-juz">{r.juz_memorized} جزء</div>
                        <span className="report-badge" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disbursements */}
              <h4 className="section-title" style={{ marginTop: '1.5rem' }}>💰 سجل الصرف</h4>
              {disbursements.length === 0 ? (
                <p className="empty-text">لا يوجد سجل صرف بعد</p>
              ) : (
                <div className="report-list">
                  {disbursements.map((d, i) => (
                    <div key={i} className="report-row">
                      <div className="report-period">{d.month}/{d.year}</div>
                      <div className="report-juz">{d.amount} ر.ي</div>
                      <span className="report-badge" style={{
                        color: d.included ? '#10b981' : '#ef4444',
                        background: d.included ? '#ecfdf5' : '#fef2f2',
                      }}>
                        {d.included
                          ? d.receipt_confirmed_at ? '✅ استُلم' : '🕐 جارٍ التوزيع'
                          : '❌ مستبعد'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:60; animation:fadeIn .2s ease; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:min(540px,95vw); max-height:85vh; background:#fff; border-radius:1.25rem; z-index:61; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.2); font-family:'Cairo','Tajawal',sans-serif; animation:popIn .2s ease; }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes popIn { from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.2rem .4rem; border-radius:6px; }
        .modal-close:hover { background:#f3f4f6; }
        .modal-body { overflow-y:auto; padding:1.25rem 1.5rem; }
        .section-title { font-size:.85rem; font-weight:700; color:#374151; margin:0 0 .75rem; }
        .report-list { display:flex; flex-direction:column; gap:.4rem; }
        .report-row { display:flex; align-items:center; gap:.75rem; padding:.5rem .65rem; background:#f8fafc; border-radius:.5rem; border:1px solid #e5eaf0; }
        .report-period { font-size:.8rem; font-weight:700; color:#1f2937; min-width:55px; }
        .report-juz { font-size:.83rem; color:#6b7a8d; flex:1; }
        .report-badge { font-size:.7rem; font-weight:700; padding:.2rem .6rem; border-radius:2rem; white-space:nowrap; }
        .empty-text { font-size:.82rem; color:#9ca3af; margin:0 0 .5rem; }
        .loading-state, .empty-state { text-align:center; padding:2rem; color:#9ca3af; font-size:.85rem; }
      `}</style>
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardView({ token, sponsor, onLogout }) {
  const [orphans,       setOrphans]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [detailOrphan,  setDetailOrphan]  = useState(null); // { id, name }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    Promise.all([
      sponsorApi.get('/sponsor/orphans', authHeaders),
      sponsorApi.get('/announcements', authHeaders).catch(() => ({ data: { announcements: [] } })),
    ])
      .then(([orphanRes, annRes]) => {
        setOrphans(orphanRes.data.orphans || []);
        setAnnouncements(annRes.data.announcements || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMonthly = orphans.reduce((s, o) => s + Number(o.monthly_amount || 0), 0);

  return (
    <div className="dash" dir="rtl">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">🤝</span>
          <div>
            <h1 className="header-title">بوابة الكافل</h1>
            <p className="header-sub">مؤسسة الأرض الطيبة</p>
          </div>
        </div>
        <div className="header-user">
          <span className="header-name">{sponsor.name}</span>
          <button className="btn-logout" onClick={onLogout}>خروج</button>
        </div>
      </header>

      <main className="main">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-icon">👦</span>
            <div>
              <div className="stat-num">{orphans.length}</div>
              <div className="stat-lbl">أيتام مكفولون</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div>
              <div className="stat-num">{totalMonthly.toLocaleString('ar-YE')}</div>
              <div className="stat-lbl">إجمالي شهري (ر.ي)</div>
            </div>
          </div>
          {announcements.length > 0 && (
            <div className="stat-card stat-announce">
              <span className="stat-icon">📢</span>
              <div>
                <div className="stat-num">{announcements.length}</div>
                <div className="stat-lbl">إعلانات نشطة</div>
              </div>
            </div>
          )}
        </div>

        {/* Orphans */}
        <section className="section">
          <h2 className="section-heading">أيتامي المكفولون</h2>

          {loading ? (
            <div className="loading">⏳ جارٍ التحميل…</div>
          ) : orphans.length === 0 ? (
            <div className="empty-card">
              <span style={{ fontSize: '2.5rem' }}>👦</span>
              <p>لا يوجد أيتام مكفولون بعد</p>
            </div>
          ) : (
            <div className="orphan-grid">
              {orphans.map((o) => (
                <div key={o.id} className="orphan-card">
                  <div className="orphan-head">
                    <div className="orphan-avatar">
                      {o.full_name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <div className="orphan-name">{o.full_name}</div>
                      <div className="orphan-meta">
                        {o.gender === 'female' ? 'أنثى' : 'ذكر'}
                        {o.governorate_ar && ` · ${o.governorate_ar}`}
                      </div>
                    </div>
                    {o.is_gifted && <span className="gifted-badge">🌟</span>}
                  </div>
                  <div className="orphan-amount">
                    <span className="amount-val">{Number(o.monthly_amount || 0).toLocaleString('ar-YE')}</span>
                    <span className="amount-unit"> ر.ي / شهر</span>
                  </div>
                  <div className="orphan-meta-row">
                    <span>📅 بدأت: {fmt(o.sponsorship_start)}</span>
                    <span>👤 {o.agent_name}</span>
                  </div>
                  <button
                    className="btn-reports"
                    onClick={() => setDetailOrphan({ id: o.id, name: o.full_name })}
                  >
                    عرض التقارير ←
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Announcements */}
        {announcements.length > 0 && (
          <section className="section">
            <h2 className="section-heading">📢 الإعلانات</h2>
            <div className="announce-list">
              {announcements.map((a) => (
                <div key={a.id} className="announce-card">
                  <div className="announce-head">
                    <h3 className="announce-title">{a.title}</h3>
                    <span className="announce-date">{fmt(a.published_at)}</span>
                  </div>
                  <p className="announce-body">{a.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Orphan detail modal */}
      {detailOrphan && (
        <OrphanDetailModal
          orphanId={detailOrphan.id}
          orphanName={detailOrphan.name}
          token={token}
          onClose={() => setDetailOrphan(null)}
        />
      )}

      <style jsx>{`
        .dash { min-height:100vh; background:#f0f4f8; font-family:'Cairo','Tajawal',sans-serif; }

        /* Header */
        .header { background:linear-gradient(135deg,#0d3d5c,#1B5E8C); color:#fff; padding:1rem 2rem; display:flex; align-items:center; justify-content:space-between; }
        .header-brand { display:flex; align-items:center; gap:.85rem; }
        .header-logo { font-size:1.75rem; }
        .header-title { font-size:1.1rem; font-weight:800; margin:0; }
        .header-sub { font-size:.72rem; color:rgba(255,255,255,.65); margin:0; }
        .header-user { display:flex; align-items:center; gap:.85rem; }
        .header-name { font-size:.88rem; font-weight:600; }
        .btn-logout { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3); color:#fff; font-family:'Cairo',sans-serif; font-size:.8rem; font-weight:600; padding:.35rem .85rem; border-radius:.5rem; cursor:pointer; transition:background .15s; }
        .btn-logout:hover { background:rgba(255,255,255,.25); }

        /* Main */
        .main { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; display:flex; flex-direction:column; gap:2rem; }

        /* Stats */
        .stats-row { display:flex; gap:1rem; flex-wrap:wrap; }
        .stat-card { flex:1; min-width:160px; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem; display:flex; align-items:center; gap:.85rem; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .stat-announce { border-color:#bfdbfe; background:#eff6ff; }
        .stat-icon { font-size:1.75rem; }
        .stat-num { font-size:1.6rem; font-weight:800; color:#0d3d5c; line-height:1; }
        .stat-lbl { font-size:.75rem; color:#6b7a8d; font-weight:500; margin-top:.2rem; }

        /* Section */
        .section {}
        .section-heading { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0 0 1rem; }
        .loading { text-align:center; padding:2rem; color:#9ca3af; font-size:.88rem; }
        .empty-card { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:3rem; background:#fff; border-radius:1rem; border:1px solid #e5eaf0; text-align:center; }
        .empty-card p { font-size:.88rem; color:#9ca3af; margin:0; }

        /* Orphan grid */
        .orphan-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.1rem; }
        .orphan-card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem; display:flex; flex-direction:column; gap:.85rem; box-shadow:0 1px 4px rgba(27,94,140,.05); transition:box-shadow .15s,transform .15s; }
        .orphan-card:hover { box-shadow:0 4px 16px rgba(27,94,140,.1); transform:translateY(-1px); }
        .orphan-head { display:flex; align-items:center; gap:.75rem; }
        .orphan-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; flex-shrink:0; }
        .orphan-name { font-size:.95rem; font-weight:700; color:#0d3d5c; }
        .orphan-meta { font-size:.75rem; color:#6b7a8d; margin-top:.15rem; }
        .gifted-badge { font-size:1.2rem; margin-right:auto; }
        .orphan-amount { background:#f0f7ff; border:1px solid #bfdbfe; border-radius:.625rem; padding:.65rem .9rem; text-align:center; }
        .amount-val { font-size:1.3rem; font-weight:800; color:#1B5E8C; }
        .amount-unit { font-size:.78rem; color:#6b7a8d; }
        .orphan-meta-row { display:flex; justify-content:space-between; font-size:.72rem; color:#9ca3af; }
        .btn-reports { width:100%; padding:.6rem; background:none; border:1.5px solid #dde5f0; border-radius:.625rem; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:700; color:#1B5E8C; cursor:pointer; transition:all .15s; }
        .btn-reports:hover { background:#f0f7ff; border-color:#1B5E8C; }

        /* Announcements */
        .announce-list { display:flex; flex-direction:column; gap:.75rem; }
        .announce-card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.25rem 1.5rem; }
        .announce-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
        .announce-title { font-size:.95rem; font-weight:700; color:#0d3d5c; margin:0; }
        .announce-date { font-size:.73rem; color:#9ca3af; }
        .announce-body { font-size:.85rem; color:#374151; margin:0; line-height:1.7; }

        @media (max-width:640px) {
          .header { padding:.85rem 1rem; }
          .main { padding:1.25rem 1rem; }
          .stats-row { flex-direction:column; }
          .orphan-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────
export default function SponsorPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [accessToken, setAccessToken] = useState('');
  const [sponsor,     setSponsor]     = useState(null);

  const handleLogin = (jwt, sponsorData) => {
    setAccessToken(jwt);
    setSponsor(sponsorData);
  };

  const handleLogout = () => {
    setAccessToken('');
    setSponsor(null);
  };

  if (!accessToken || !sponsor) {
    return <LoginView token={token} onLogin={handleLogin} />;
  }

  return (
    <DashboardView
      token={accessToken}
      sponsor={sponsor}
      onLogout={handleLogout}
    />
  );
}

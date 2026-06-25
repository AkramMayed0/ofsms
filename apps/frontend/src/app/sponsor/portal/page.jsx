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
 *   GET  /api/ads/sponsor/feed       → active announcements
 *
 * NOTE: This page manages its own auth state (token in component memory)
 *       because it is the public portal entry point — not tied to the
 *       staff useSponsorStore. All API calls pass the token explicitly.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, User, Handshake, CheckCircle2, XCircle } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import axios from 'axios';

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const API_ENDPOINTS = {
  LOGIN:        `${BASE_URL}/sponsor/login`,
  ORPHANS:      '/sponsor/orphans',
  FEED:         '/ads/sponsor/feed',
  REPORTS:      (id) => `/sponsor/reports/${id}`,
};

const QURAN_STATUS = {
  approved: { label: 'معتمد',        color: '#10b981', bg: '#ecfdf5' },
  rejected: { label: 'مرفوض',        color: '#ef4444', bg: '#fef2f2' },
  pending:  { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fffbeb' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** Minimal axios instance for this public portal (no store interceptor) */
const portalApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const mapAdToAnnouncement = (ad) => ({
  id: ad.id,
  title: ad.beneficiary_type === 'family'
    ? `طلب كفالة أسرة: ${ad.beneficiary_name}`
    : `طلب كفالة: ${ad.beneficiary_name}`,
  body: ad.beneficiary_type === 'family'
    ? `من سيكفل هذه الأسرة؟ المحافظة: ${ad.governorate_ar || '—'}`
    : `من سيكفل هذا الطفل؟ المحافظة: ${ad.governorate_ar || '—'}`,
  published_at: ad.published_at,
});

// ── LoginView ─────────────────────────────────────────────────────────────────

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
      const { data } = await axios.post(API_ENDPOINTS.LOGIN, { portalToken: token, password });
      onLogin(data.accessToken, data.sponsor);
    } catch (err) {
      setError(err.response?.data?.error || 'رمز البوابة أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row-reverse min-h-screen bg-gray-100 font-sans" dir="rtl">

      {/* Brand panel */}
      <aside className="relative w-[42%] bg-gradient-to-[160deg] from-[#0d3d5c] via-[#1B5E8C] to-[#1a7a6e] flex items-center justify-center overflow-hidden shrink-0 hidden md:flex">
        {/* Static decorative dots (fixed positions — no Math.random to avoid hydration mismatch) */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            [12, 23], [45, 67], [78, 12], [33, 89], [60, 45],
            [85, 30], [20, 55], [55, 80], [90, 70], [10, 10],
            [70, 20], [40, 40], [25, 75], [65, 55], [80, 85],
          ].map(([top, left], i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/12 animate-[pulse_3s_ease-in-out_infinite]"
              style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white px-8">
          <span className="block text-[3.5rem] mb-4">🛡️</span>
          <h1 className="text-[2rem] font-bold m-0 mb-2" style={{ textShadow: '0 2px 16px rgba(0,0,0,.18)' }}>بوابة الكفلاء</h1>
          <p className="text-[0.75rem] text-white/60 tracking-widest uppercase m-0 mb-6 leading-loose">
            Orphan &amp; Family Sponsorship<br />Management System
          </p>
          <div className="w-10 h-0.5 bg-white/30 mx-auto mb-5 rounded" />
          <p className="text-[0.9rem] font-medium text-white/80 tracking-[0.15em] m-0">شفافية · رعاية · أثر</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center py-8 px-6">
        <div className="w-full max-w-[400px] bg-white rounded-2xl py-10 px-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_24px_rgba(27,94,140,0.09)] border border-[rgba(27,94,140,0.08)] text-center">
          <div className="text-[2.5rem] mb-4 flex justify-center text-[#0d3d5c]"><Handshake size={40} /></div>
          <h2 className="text-[1.4rem] font-bold text-[#0d3d5c] m-0 mb-1">تسجيل دخول الكافل</h2>
          <p className="text-[0.83rem] text-[#6b7a8d] m-0 mb-7 leading-relaxed">أدخل كلمة المرور للوصول إلى محفظة كفالاتك</p>

          {!token && (
            <div className="bg-red-50 border border-red-200 rounded-xl py-2.5 px-3.5 text-[0.82rem] text-red-700 font-medium text-right mb-2 flex items-center gap-2">
              <AlertTriangle size={18} /> رابط البوابة غير صحيح. يرجى استخدام الرابط المُرسَل إليك.
            </div>
          )}

          {token && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right" noValidate>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl py-2.5 px-3.5 text-[0.82rem] text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold text-gray-700">كلمة المرور</label>
                <input
                  type="password"
                  className="border-[1.5px] border-gray-300 rounded-xl py-2.5 px-3.5 text-[0.9rem] font-sans text-gray-800 bg-gray-50 outline-none transition-colors focus:border-[#1B5E8C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.12)] direction-ltr text-left"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  autoFocus
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white font-sans text-[0.95rem] font-bold border-none rounded-xl cursor-pointer transition-all shadow-[0_2px_8px_rgba(27,94,140,0.28)] disabled:opacity-65 disabled:cursor-not-allowed hover:not(:disabled):bg-gradient-to-br hover:not(:disabled):from-[#2E7EB8] hover:not(:disabled):to-[#1B5E8C] hover:not(:disabled):-translate-y-px"
                disabled={loading || !token}
              >
                {loading
                  ? <><span className="inline-block w-[15px] h-[15px] border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" /> جارٍ التحقق…</>
                  : 'دخول إلى البوابة ←'
                }
              </button>
            </form>
          )}

          <p className="text-[0.72rem] text-gray-400 mt-6 mb-0">مؤسسة إكرام النعمة الخيرية · نظام كفالة الأيتام</p>
        </div>
      </main>
    </div>
  );
}

// ── OrphanDetailModal ─────────────────────────────────────────────────────────

function OrphanDetailModal({ orphanId, orphanName, token, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi
      .get(API_ENDPOINTS.REPORTS(orphanId), { headers: authHeader(token) })
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orphanId, token]);

  const quranReports  = data?.quran_reports  || [];
  const disbursements = data?.disbursements  || [];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] animate-[fadeIn_0.2s_ease]" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(540px,95vw)] max-h-[85vh] bg-white rounded-2xl z-[61] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] font-sans animate-[popIn_0.2s_ease]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100">
          <h3 className="text-[1rem] font-extrabold text-[#0d3d5c] m-0">تقارير — {orphanName}</h3>
          <button
            className="bg-transparent border-none text-gray-400 cursor-pointer p-1 px-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto py-5 px-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-[0.85rem]">⏳ جارٍ التحميل…</div>
          ) : !data ? (
            <div className="text-center py-8 text-gray-400 text-[0.85rem]">تعذّر تحميل البيانات</div>
          ) : (
            <>
              {/* Quran reports */}
              <h4 className="text-[0.85rem] font-bold text-gray-700 m-0 mb-3">📖 تقارير حفظ القرآن</h4>
              {quranReports.length === 0 ? (
                <p className="text-[0.82rem] text-gray-400 mb-2">لا توجد تقارير بعد</p>
              ) : (
                <div className="flex flex-col gap-1.5 mb-6">
                  {quranReports.map((r) => {
                    const cfg = QURAN_STATUS[r.status] || QURAN_STATUS.pending;
                    return (
                      <div key={r.id} className="flex items-center gap-3 py-2 px-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-[0.8rem] font-bold text-gray-800 min-w-[55px]">{r.month}/{r.year}</div>
                        <div className="text-[0.83rem] text-gray-500 flex-1">{r.juz_memorized} جزء</div>
                        <span className="text-[0.7rem] font-bold py-0.5 px-2.5 rounded-full whitespace-nowrap" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disbursements */}
              <h4 className="text-[0.85rem] font-bold text-gray-700 m-0 mb-3">💰 سجل الصرف</h4>
              {disbursements.length === 0 ? (
                <p className="text-[0.82rem] text-gray-400 mb-2">لا يوجد سجل صرف بعد</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {disbursements.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[0.8rem] font-bold text-gray-800 min-w-[55px]">{d.month}/{d.year}</div>
                      <div className="text-[0.83rem] text-gray-500 flex-1">{d.amount} ر.ي</div>
                      <span
                        className="text-[0.7rem] font-bold py-0.5 px-2.5 rounded-full whitespace-nowrap flex items-center gap-1"
                        style={{ color: d.included ? '#10b981' : '#ef4444', background: d.included ? '#ecfdf5' : '#fef2f2' }}
                      >
                        {d.included
                          ? d.receipt_confirmed_at
                            ? <><CheckCircle2 size={12} /> استُلم</>
                            : '🕐 جارٍ التوزيع'
                          : <><XCircle size={12} /> مستبعد</>
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── DashboardView ─────────────────────────────────────────────────────────────

function DashboardView({ token, sponsor, onLogout }) {
  const [orphans,       setOrphans]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [detailOrphan,  setDetailOrphan]  = useState(null); // { id, name }

  const headers = authHeader(token);

  useEffect(() => {
    Promise.all([
      portalApi.get(API_ENDPOINTS.ORPHANS,  { headers }),
      portalApi.get(API_ENDPOINTS.FEED,     { headers }).catch(() => ({ data: { ads: [] } })),
    ])
      .then(([orphanRes, annRes]) => {
        setOrphans(orphanRes.data.orphans || []);
        setAnnouncements((annRes.data.ads || []).map(mapAdToAnnouncement));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMonthly = orphans.reduce((s, o) => s + Number(o.monthly_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">

      {/* Header */}
      <header className="bg-gradient-to-r from-[#0d3d5c] to-[#1B5E8C] text-white py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="text-[1.75rem]"><Handshake size={32} /></span>
          <div>
            <h1 className="text-[1.1rem] font-extrabold m-0">بوابة الكافل</h1>
            <p className="text-[0.72rem] text-white/65 m-0">مؤسسة إكرام النعمة الخيرية</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-[0.88rem] font-semibold">{sponsor.name}</span>
          <button
            className="bg-white/15 border border-white/30 text-white font-sans text-[0.8rem] font-semibold py-1.5 px-3.5 rounded-lg cursor-pointer hover:bg-white/25 transition-colors"
            onClick={onLogout}
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto py-8 px-6 flex flex-col gap-8 max-[640px]:py-5 max-[640px]:px-4">

        {/* Stats row */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[160px] bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            <span className="text-[#0d3d5c]"><User size={18} /></span>
            <div>
              <div className="text-[1.6rem] font-extrabold text-[#0d3d5c] leading-none">{orphans.length}</div>
              <div className="text-[0.75rem] text-[#6b7a8d] font-medium mt-0.5">أيتام مكفولون</div>
            </div>
          </div>
          <div className="flex-1 min-w-[160px] bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
            <span className="text-[1.75rem]">💰</span>
            <div>
              <div className="text-[1.6rem] font-extrabold text-[#0d3d5c] leading-none">{totalMonthly.toLocaleString('ar-YE')}</div>
              <div className="text-[0.75rem] text-[#6b7a8d] font-medium mt-0.5">إجمالي شهري (ر.ي)</div>
            </div>
          </div>
          {announcements.length > 0 && (
            <div className="flex-1 min-w-[160px] bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_1px_4px_rgba(27,94,140,0.05)]">
              <span className="text-[1.75rem]">📢</span>
              <div>
                <div className="text-[1.6rem] font-extrabold text-[#0d3d5c] leading-none">{announcements.length}</div>
                <div className="text-[0.75rem] text-[#6b7a8d] font-medium mt-0.5">إعلانات نشطة</div>
              </div>
            </div>
          )}
        </div>

        {/* Orphans section */}
        <section>
          <h2 className="text-[1.05rem] font-extrabold text-[#0d3d5c] m-0 mb-4">أيتامي المكفولون</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-[0.88rem]">⏳ جارٍ التحميل…</div>
          ) : orphans.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 bg-white rounded-2xl border border-gray-200 text-center">
              <span className="text-[2.5rem] text-gray-300"><User size={40} /></span>
              <p className="text-[0.88rem] text-gray-400 m-0">لا يوجد أيتام مكفولون بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-[640px]:grid-cols-1">
              {orphans.map((o) => (
                <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3.5 shadow-[0_1px_4px_rgba(27,94,140,0.05)] transition-all hover:shadow-[0_4px_16px_rgba(27,94,140,0.1)] hover:-translate-y-px">
                  {/* Head */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1B5E8C] to-[#0d3d5c] text-white flex items-center justify-center text-[1.1rem] font-bold shrink-0">
                      {o.full_name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <div className="text-[0.95rem] font-bold text-[#0d3d5c]">{o.full_name}</div>
                      <div className="text-[0.75rem] text-[#6b7a8d] mt-0.5">
                        {o.gender === 'female' ? 'أنثى' : 'ذكر'}
                        {o.governorate_ar && ` · ${o.governorate_ar}`}
                      </div>
                    </div>
                    {o.is_gifted && <span className="text-[1.2rem] mr-auto">🌟</span>}
                  </div>

                  {/* Monthly amount */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl py-2.5 px-3.5 text-center">
                    <span className="text-[1.3rem] font-extrabold text-[#1B5E8C]">{Number(o.monthly_amount || 0).toLocaleString('ar-YE')}</span>
                    <span className="text-[0.78rem] text-[#6b7a8d]"> ر.ي / شهر</span>
                  </div>

                  {/* Meta */}
                  <div className="flex justify-between text-[0.72rem] text-gray-400">
                    <span>📅 بدأت: {fmt(o.sponsorship_start)}</span>
                    <span>👤 {o.agent_name}</span>
                  </div>

                  {/* Reports button */}
                  <button
                    className="w-full py-2.5 bg-transparent border-[1.5px] border-gray-200 rounded-xl font-sans text-[0.82rem] font-bold text-[#1B5E8C] cursor-pointer transition-all hover:bg-blue-50 hover:border-[#1B5E8C]"
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
          <section>
            <h2 className="text-[1.05rem] font-extrabold text-[#0d3d5c] m-0 mb-4">📢 الإعلانات</h2>
            <div className="flex flex-col gap-3">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-2xl py-5 px-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[0.95rem] font-bold text-[#0d3d5c] m-0">{a.title}</h3>
                    <span className="text-[0.73rem] text-gray-400">{fmt(a.published_at)}</span>
                  </div>
                  <p className="text-[0.85rem] text-gray-700 m-0 leading-relaxed">{a.body}</p>
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

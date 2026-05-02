'use client';

/**
 * Route: /sponsor/dashboard
 * APIs:
 *   GET /api/sponsor/me       → sponsor info
 *   GET /api/sponsor/orphans  → list of sponsored orphans
 *   GET /api/announcements    → public announcements board
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import sponsorApi from '../sponsorApi';
import useSponsorStore from '../useSponsorStore';

const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة', color: '#92400E', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',  color: '#1E40AF', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',  color: '#065F46', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',        color: '#991B1B', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',      color: '#6B7280', bg: '#F3F4F6' },
};

export default function SponsorDashboard() {
  const router = useRouter();
  const { sponsor, clearSponsorAuth, isAuthenticated } = useSponsorStore();

  const [orphans, setOrphans]             = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/sponsor/login');
      return;
    }
    Promise.all([
      sponsorApi.get('/sponsor/orphans'),
      sponsorApi.get('/announcements').catch(() => ({ data: { announcements: [] } })),
    ])
      .then(([orphansRes, announcementsRes]) => {
        setOrphans(orphansRes.data.orphans || []);
        setAnnouncements((announcementsRes.data.announcements || []).filter(a => a.is_active));
      })
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearSponsorAuth();
    router.push('/sponsor/login');
  };

  return (
    <div className="root" dir="rtl">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-icon">🤝</span>
            <div>
              <span className="header-title">بوابة الكافل</span>
              <span className="header-org">مؤسسة الأرض الطيبة</span>
            </div>
          </div>
          <div className="header-user">
            <span className="user-name">أهلاً، {sponsor?.name || 'الكافل'}</span>
            <button className="logout-btn" onClick={handleLogout}>خروج</button>
          </div>
        </div>
      </header>

      <main className="main">

        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Welcome card */}
        <div className="welcome-card">
          <div className="welcome-text">
            <h1 className="welcome-title">مرحباً بك في بوابة الكافل</h1>
            <p className="welcome-sub">يمكنك متابعة أيتامك وتقاريرهم الشهرية من هذه الصفحة</p>
          </div>
          <div className="welcome-stat">
            <span className="stat-big">{loading ? '—' : orphans.length}</span>
            <span className="stat-lbl">يتيم تحت كفالتك</span>
          </div>
        </div>

        <div className="content-grid">

          {/* Orphans section */}
          <section className="section orphans-section">
            <h2 className="section-title">
              <span className="section-icon">👦</span>
              أيتامك المكفولون
            </h2>

            {loading ? (
              <div className="orphans-list">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : orphans.length === 0 ? (
              <div className="empty">
                <span>🔍</span>
                <p>لا يوجد أيتام مرتبطون بكفالتك حالياً</p>
              </div>
            ) : (
              <div className="orphans-list">
                {orphans.map(orphan => (
                  <OrphanCard key={orphan.id} orphan={orphan} />
                ))}
              </div>
            )}
          </section>

          {/* Announcements */}
          <section className="section">
            <h2 className="section-title">
              <span className="section-icon">📢</span>
              إعلانات المؤسسة
            </h2>

            {loading ? (
              <div className="ann-skeleton" />
            ) : announcements.length === 0 ? (
              <div className="empty small">
                <span>📭</span>
                <p>لا توجد إعلانات حالياً</p>
              </div>
            ) : (
              <div className="ann-list">
                {announcements.map(ann => (
                  <div key={ann.id} className="ann-card">
                    <span className="ann-dot" />
                    <div>
                      <p className="ann-title">{ann.title}</p>
                      <p className="ann-body">{ann.body}</p>
                      <span className="ann-date">
                        {new Date(ann.published_at).toLocaleDateString('ar-YE', { day:'numeric', month:'long', year:'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <style jsx>{`
        * { box-sizing: border-box; }
        .root { min-height:100vh; background:#f0f4f8; font-family:'Cairo','Tajawal',sans-serif; }

        /* Header */
        .header { background:#fff; border-bottom:1px solid #e5eaf0; position:sticky; top:0; z-index:10; box-shadow:0 1px 4px rgba(0,0,0,.06); }
        .header-inner { max-width:1100px; margin:0 auto; padding:.9rem 1.5rem; display:flex; align-items:center; justify-content:space-between; }
        .header-brand { display:flex; align-items:center; gap:.75rem; }
        .header-icon { font-size:1.5rem; }
        .header-title { display:block; font-size:1rem; font-weight:800; color:#0d3d5c; line-height:1; }
        .header-org { display:block; font-size:.7rem; color:#9ca3af; margin-top:.15rem; }
        .header-user { display:flex; align-items:center; gap:1rem; }
        .user-name { font-size:.85rem; font-weight:600; color:#374151; }
        .logout-btn { background:none; border:1.5px solid #dde5f0; border-radius:.5rem; padding:.4rem .85rem; font-family:'Cairo',sans-serif; font-size:.78rem; font-weight:600; color:#6b7280; cursor:pointer; }
        .logout-btn:hover { background:#f9fafb; color:#dc2626; border-color:#fca5a5; }

        .main { max-width:1100px; margin:0 auto; padding:2rem 1.5rem; display:flex; flex-direction:column; gap:1.5rem; }

        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.75rem 1rem; border-radius:.75rem; font-size:.875rem; }

        /* Welcome */
        .welcome-card { background:linear-gradient(135deg,#1a4a2e,#2d7a4a); border-radius:1.25rem; padding:1.75rem 2rem; display:flex; align-items:center; justify-content:space-between; color:#fff; }
        .welcome-title { font-size:1.3rem; font-weight:800; margin:0 0 .4rem; }
        .welcome-sub { font-size:.83rem; color:rgba(255,255,255,.75); margin:0; }
        .stat-big { display:block; font-size:2.5rem; font-weight:800; line-height:1; }
        .stat-lbl { display:block; font-size:.75rem; color:rgba(255,255,255,.7); margin-top:.25rem; text-align:center; }

        /* Grid */
        .content-grid { display:grid; grid-template-columns:2fr 1fr; gap:1.5rem; }
        @media(max-width:768px){ .content-grid{ grid-template-columns:1fr; } }

        /* Section */
        .section { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.25rem; }
        .section-title { display:flex; align-items:center; gap:.6rem; font-size:.95rem; font-weight:700; color:#0d3d5c; margin:0 0 1.1rem; padding-bottom:.75rem; border-bottom:1.5px solid #f3f4f6; }
        .section-icon { font-size:1.1rem; }

        /* Orphan cards */
        .orphans-list { display:flex; flex-direction:column; gap:.75rem; }

        /* Announcements */
        .ann-list { display:flex; flex-direction:column; gap:.85rem; }
        .ann-card { display:flex; gap:.75rem; align-items:flex-start; }
        .ann-dot { width:8px; height:8px; border-radius:50%; background:#2d7a4a; flex-shrink:0; margin-top:.35rem; }
        .ann-title { font-size:.85rem; font-weight:700; color:#0d3d5c; margin:0 0 .25rem; }
        .ann-body { font-size:.78rem; color:#6b7280; margin:0 0 .25rem; line-height:1.6; }
        .ann-date { font-size:.68rem; color:#9ca3af; }
        .ann-skeleton { height:180px; border-radius:.75rem; background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

        .empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:2.5rem 1rem; color:#9ca3af; font-size:.83rem; text-align:center; }
        .empty span { font-size:2rem; }
        .empty p { margin:0; }
        .empty.small { padding:1.5rem 1rem; }

        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}

function OrphanCard({ orphan }) {
  const cfg = STATUS_CONFIG[orphan.status] || STATUS_CONFIG.inactive;
  const age = orphan.date_of_birth
    ? Math.floor((Date.now() - new Date(orphan.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <Link href={`/sponsor/orphans/${orphan.id}`} style={{ textDecoration:'none' }}>
      <div className="ocard">
        <div className="ocard-avatar">
          {orphan.gender === 'female' ? '👧' : '👦'}
        </div>
        <div className="ocard-info">
          <div className="ocard-top">
            <span className="ocard-name">{orphan.full_name}</span>
            {orphan.is_gifted && <span className="gifted-tag">⭐ موهوب</span>}
          </div>
          <div className="ocard-meta">
            {age !== null && <span>العمر: {age} سنة</span>}
            <span>•</span>
            <span>{orphan.governorate_ar}</span>
          </div>
          <div className="ocard-bottom">
            <span className="status-badge" style={{ color:cfg.color, background:cfg.bg }}>
              {cfg.label}
            </span>
            <span className="ocard-amount">
              {parseFloat(orphan.monthly_amount || 0).toLocaleString('ar-YE')} ريال/شهر
            </span>
          </div>
        </div>
        <span className="ocard-arrow">←</span>
      </div>

      <style jsx>{`
        .ocard { display:flex; align-items:center; gap:.85rem; background:#fafafa; border:1.5px solid #e5eaf0; border-radius:.875rem; padding:.85rem 1rem; cursor:pointer; transition:all .15s; }
        .ocard:hover { background:#f0f7ff; border-color:#93c5fd; transform:translateX(-2px); }
        .ocard-avatar { font-size:1.8rem; flex-shrink:0; width:44px; height:44px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1.5px solid #e5eaf0; }
        .ocard-info { flex:1; display:flex; flex-direction:column; gap:.3rem; }
        .ocard-top { display:flex; align-items:center; gap:.5rem; }
        .ocard-name { font-size:.9rem; font-weight:700; color:#0d3d5c; }
        .gifted-tag { background:#FEF3C7; color:#92400E; font-size:.65rem; font-weight:700; padding:.15rem .45rem; border-radius:999px; }
        .ocard-meta { font-size:.73rem; color:#9ca3af; display:flex; gap:.4rem; }
        .ocard-bottom { display:flex; align-items:center; gap:.6rem; }
        .status-badge { font-size:.68rem; font-weight:700; padding:.15rem .5rem; border-radius:999px; }
        .ocard-amount { font-size:.75rem; font-weight:700; color:#2d7a4a; margin-right:auto; }
        .ocard-arrow { color:#9ca3af; font-size:.85rem; flex-shrink:0; }
      `}</style>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background:'#fafafa', border:'1.5px solid #e5eaf0', borderRadius:'.875rem', padding:'.85rem 1rem', display:'flex', gap:'.85rem', alignItems:'center' }}>
      <div style={{ width:44, height:44, borderRadius:'50%', background:'#e5e7eb' }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'.4rem' }}>
        <div style={{ height:14, width:'40%', borderRadius:4, background:'#e5e7eb' }} />
        <div style={{ height:11, width:'60%', borderRadius:4, background:'#f3f4f6' }} />
        <div style={{ height:11, width:'30%', borderRadius:4, background:'#f3f4f6' }} />
      </div>
    </div>
  );
}

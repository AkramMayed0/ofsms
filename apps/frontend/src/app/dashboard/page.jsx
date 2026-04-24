'use client';

/**
 * GM Dashboard — feature/ui-dashboard-gm
 *
 * Widgets (per SADD FR-039):
 *   1. Stat cards  — total orphans, pending items, gifted orphans, monthly disbursement
 *   2. Governorate bar chart — orphans per governorate (pure CSS)
 *   3. Sponsor ranking list — top sponsors by active sponsorships
 *   4. Latest orphans table — last 10 added with status badge
 *
 * Data source: GET /api/dashboard/gm
 * Auth: GM role only (enforced by AppShell + middleware)
 */

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة',  color: '#F59E0B', bg: '#FEF3C7' },
  under_marketing:   { label: 'تحت التسويق',   color: '#3B82F6', bg: '#EFF6FF' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#10B981', bg: '#ECFDF5' },
  rejected:          { label: 'مرفوض',         color: '#EF4444', bg: '#FEF2F2' },
  inactive:          { label: 'غير نشط',       color: '#6B7280', bg: '#F3F4F6' },
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconStar = ({ size = 22, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M16 12h.01"/>
    <path d="M2 10h20"/>
  </svg>
);

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconZap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, loading }) {
  const displayed = useCountUp(loading ? 0 : (value || 0));
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-body">
        <span className="stat-value">
          {loading ? '—' : displayed.toLocaleString('ar-YE')}
        </span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
      <div className="stat-accent-bar" />
    </div>
  );
}

// ── Governorate bar chart (pure CSS) ─────────────────────────────────────────
function GovernorateChart({ data, loading }) {
  if (loading) return <div className="chart-skeleton" />;
  if (!data?.length) return <p className="empty-state">لا توجد بيانات</p>;
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="gov-chart">
      {data.slice(0, 8).map((row, i) => (
        <div key={i} className="gov-row">
          <span className="gov-name">{row.governorate_ar}</span>
          <div className="gov-bar-track">
            <div
              className="gov-bar-fill"
              style={{ width: `${(row.count / max) * 100}%`, animationDelay: `${i * 80}ms` }}
            />
          </div>
          <span className="gov-count">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Sponsor ranking list ──────────────────────────────────────────────────────
function SponsorRanking({ data, loading }) {
  if (loading) return <div className="list-skeleton" />;
  if (!data?.length) return <p className="empty-state">لا يوجد كفلاء بعد</p>;
  return (
    <ol className="sponsor-list">
      {data.slice(0, 8).map((row, i) => (
        <li key={i} className="sponsor-row">
          <span className="sponsor-rank">{i + 1}</span>
          <span className="sponsor-name">{row.sponsor_name}</span>
          <span className="sponsor-badge">{row.count} يتيم</span>
        </li>
      ))}
    </ol>
  );
}

// ── Latest orphans table ──────────────────────────────────────────────────────
function LatestOrphans({ data, loading }) {
  if (loading) return <div className="table-skeleton" />;
  if (!data?.length) return <p className="empty-state">لم يُضَف أيتام بعد</p>;
  return (
    <div className="table-wrap">
      <table className="orphans-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>المحافظة</th>
            <th>الحالة</th>
            <th>تاريخ الإضافة</th>
          </tr>
        </thead>
        <tbody>
          {data.map((orphan) => {
            const status = STATUS_CONFIG[orphan.status] || STATUS_CONFIG.inactive;
            const date = new Date(orphan.created_at).toLocaleDateString('ar-YE', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            return (
              <tr key={orphan.id}>
                <td className="orphan-name">
                  {orphan.is_gifted && (
                    <span className="gifted-icon" title="موهوب">
                      <IconStar size={13} filled />
                    </span>
                  )}
                  {orphan.full_name}
                </td>
                <td>{orphan.governorate_ar}</td>
                <td>
                  <span className="status-badge" style={{ color: status.color, background: status.bg }}>
                    {status.label}
                  </span>
                </td>
                <td className="date-cell">{date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Pending items bar ─────────────────────────────────────────────────────────
function PendingAlerts({ pending, loading }) {
  if (loading || !pending) return null;
  const items = [
    { label: 'طلبات تسجيل معلّقة',  count: pending.registrations, href: '/supervisor/queue', color: '#F59E0B' },
    { label: 'تقارير حفظ معلّقة',    count: pending.quran_reports, href: '/quran-reports',    color: '#3B82F6' },
    { label: 'كشوف صرف معلّقة',      count: pending.disbursements, href: '/disbursements',    color: '#8B5CF6' },
  ].filter(i => i.count > 0);
  if (!items.length) return null;
  return (
    <div className="pending-bar">
      <span className="pending-title"><IconZap />يتطلب اهتمامك</span>
      {items.map((item, i) => (
        <a key={i} href={item.href} className="pending-chip" style={{ '--chip-color': item.color }}>
          <span className="chip-count">{item.count}</span>
          {item.label}
        </a>
      ))}
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────────────────────
export default function GmDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/dashboard/gm')
      .then(res => setData(res.data))
      .catch(() => setError('تعذّر تحميل بيانات لوحة التحكم'))
      .finally(() => setLoading(false));
  }, []);

  const disbursement = data?.monthly_disbursement_summary;
  const releasedPct  = disbursement?.total
    ? Math.round((disbursement.released / disbursement.total) * 100)
    : 0;

  return (
    <AppShell>
      <div className="gm-dashboard" dir="rtl">

        <div className="page-header">
          <div>
            <h1 className="page-title">لوحة التحكم</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('ar-YE', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <IconAlertTriangle />
            {error}
          </div>
        )}

        <PendingAlerts pending={data?.pending_count} loading={loading} />

        <div className="stat-grid">
          <StatCard label="إجمالي الأيتام"    value={data?.total_orphans}  icon={<IconUsers />}  accent="#1B5E8C" loading={loading} />
          <StatCard label="الأيتام الموهوبون" value={data?.gifted_count}   icon={<IconStar />}   accent="#F0A500" loading={loading} />
          <StatCard label="الصرف الشهري"      value={disbursement?.total}  icon={<IconWallet />} accent="#10B981" loading={loading} sub={`${releasedPct}% مُحرَّر`} />
          <StatCard
            label="البنود المعلّقة"
            value={data ? (data.pending_count.registrations + data.pending_count.quran_reports + data.pending_count.disbursements) : 0}
            icon={<IconClock />}
            accent="#EF4444"
            loading={loading}
          />
        </div>

        <div className="mid-grid">
          <div className="widget">
            <h2 className="widget-title">الأيتام حسب المحافظة</h2>
            <GovernorateChart data={data?.orphans_per_governorate} loading={loading} />
          </div>
          <div className="widget">
            <h2 className="widget-title">أعلى الكفلاء نشاطاً</h2>
            <SponsorRanking data={data?.orphans_per_sponsor} loading={loading} />
          </div>
        </div>

        <div className="widget">
          <h2 className="widget-title">آخر الأيتام المضافين</h2>
          <LatestOrphans data={data?.latest_orphans} loading={loading} />
        </div>

      </div>

      <style jsx>{`
        .gm-dashboard { display: flex; flex-direction: column; gap: 1.5rem; font-family: 'Cairo', 'Tajawal', sans-serif; }

        .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .page-title  { font-size: 1.6rem; font-weight: 700; color: #0d3d5c; margin: 0 0 0.2rem; }
        .page-subtitle { font-size: 0.82rem; color: #9ca3af; margin: 0; }

        .error-banner {
          display: flex; align-items: center; gap: 0.5rem;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.875rem;
        }

        .pending-bar {
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 0.875rem; padding: 0.75rem 1rem;
        }
        .pending-title { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700; color: #374151; flex-shrink: 0; }
        .pending-chip {
          display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem;
          border-radius: 999px; font-size: 0.78rem; font-weight: 600; text-decoration: none;
          background: color-mix(in srgb, var(--chip-color) 12%, white);
          color: var(--chip-color); border: 1px solid color-mix(in srgb, var(--chip-color) 25%, white);
          transition: transform 0.12s;
        }
        .pending-chip:hover { transform: translateY(-1px); }
        .chip-count {
          background: var(--chip-color); color: white; border-radius: 999px;
          padding: 0 0.4rem; font-size: 0.72rem; font-weight: 700; min-width: 1.2rem; text-align: center;
        }

        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .stat-grid { grid-template-columns: 1fr; } }

        .stat-card {
          position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem;
          padding: 1.25rem 1.25rem 1.25rem 1.5rem; display: flex; gap: 1rem; align-items: flex-start;
          overflow: hidden; transition: box-shadow 0.15s, transform 0.15s;
        }
        .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .stat-accent-bar {
          position: absolute; right: 0; top: 0; bottom: 0; width: 4px;
          background: var(--accent); border-radius: 0 1rem 1rem 0;
        }
        .stat-icon {
          flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 0.625rem;
          background: color-mix(in srgb, var(--accent) 10%, white);
          display: flex; align-items: center; justify-content: center;
        }
        .stat-body  { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .stat-value { font-size: 1.75rem; font-weight: 700; color: #0d3d5c; line-height: 1; font-variant-numeric: tabular-nums; }
        .stat-label { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
        .stat-sub   { font-size: 0.72rem; color: #10B981; font-weight: 600; }

        .mid-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 1rem; }
        @media (max-width: 800px) { .mid-grid { grid-template-columns: 1fr; } }

        .widget { background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.25rem; }
        .widget-title { font-size: 0.9rem; font-weight: 700; color: #1B5E8C; margin: 0 0 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; }

        .gov-chart { display: flex; flex-direction: column; gap: 0.55rem; }
        .gov-row   { display: grid; grid-template-columns: 7rem 1fr 2.5rem; align-items: center; gap: 0.75rem; }
        .gov-name  { font-size: 0.78rem; color: #374151; font-weight: 500; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gov-bar-track { height: 8px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
        .gov-bar-fill  { height: 100%; background: linear-gradient(90deg, #1B5E8C, #2E7EB8); border-radius: 999px; animation: barGrow 0.6s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes barGrow { from { width: 0% !important; } }
        .gov-count { font-size: 0.75rem; font-weight: 700; color: #1B5E8C; text-align: left; }

        .sponsor-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .sponsor-row  { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: #fafafa; transition: background 0.12s; }
        .sponsor-row:hover { background: #f0f4f8; }
        .sponsor-rank  { width: 1.4rem; height: 1.4rem; border-radius: 50%; background: #1B5E8C; color: white; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sponsor-name  { flex: 1; font-size: 0.82rem; color: #374151; font-weight: 500; }
        .sponsor-badge { font-size: 0.72rem; font-weight: 700; color: #1B5E8C; background: #EFF6FF; padding: 0.15rem 0.5rem; border-radius: 999px; }

        .table-wrap { overflow-x: auto; }
        .orphans-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .orphans-table th { text-align: right; padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #9ca3af; border-bottom: 2px solid #f3f4f6; white-space: nowrap; }
        .orphans-table td { padding: 0.65rem 0.75rem; color: #374151; border-bottom: 1px solid #f9fafb; }
        .orphans-table tr:last-child td { border-bottom: none; }
        .orphans-table tr:hover td { background: #fafafa; }
        .orphan-name { font-weight: 600; color: #0d3d5c; display: flex; align-items: center; gap: 0.3rem; }
        .gifted-icon { color: #F0A500; display: flex; align-items: center; flex-shrink: 0; }
        .status-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
        .date-cell { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; }

        .chart-skeleton, .list-skeleton, .table-skeleton {
          height: 180px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 0.5rem;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state { text-align: center; color: #9ca3af; font-size: 0.82rem; padding: 2rem 0; margin: 0; }
      `}</style>
    </AppShell>
  );
}

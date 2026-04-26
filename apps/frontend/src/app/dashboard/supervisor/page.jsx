'use client';

/**
 * Supervisor Dashboard — feature/ui-dashboard-supervisor
 *
 * Widgets (per SADD FR-040):
 *   1. Stat cards  — pending registrations, pending Quran reports, disbursement status
 *   2. Upcoming disbursement date countdown card
 *   3. Action list — direct links to things needing attention
 *
 * Data source: GET /api/dashboard/supervisor
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import AppShell from '../../../components/AppShell';

// ── Status label map for disbursement ────────────────────────────────────────
const DISBURSEMENT_STATUS = {
  draft:               { label: 'مسودة — بانتظار اعتمادك',      color: '#F59E0B', bg: '#FEF3C7' },
  supervisor_approved: { label: 'أُرسل للقسم المالي',            color: '#3B82F6', bg: '#EFF6FF' },
  finance_approved:    { label: 'بانتظار إقرار المدير العام',    color: '#8B5CF6', bg: '#F5F3FF' },
  released:            { label: 'مُحرَّر — تم الصرف',            color: '#10B981', bg: '#ECFDF5' },
  rejected:            { label: 'مرفوض — يحتاج مراجعة',         color: '#EF4444', bg: '#FEF2F2' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);

const IconBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M16 12h.01"/><path d="M2 10h20"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, loading, href }) {
  const content = (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-body">
        <span className="stat-value">{loading ? '—' : (value ?? 0).toLocaleString('ar-YE')}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
      <div className="stat-accent-bar" />
    </div>
  );
  return href ? <Link href={href} className="stat-link">{content}</Link> : content;
}

// ── Disbursement status card ──────────────────────────────────────────────────
function DisbursementCard({ list, nextDate, loading }) {
  if (loading) return <div className="disb-skeleton" />;

  const daysUntil = nextDate
    ? Math.ceil((new Date(nextDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const statusInfo = list ? DISBURSEMENT_STATUS[list.status] : null;

  return (
    <div className="disb-card">
      <div className="disb-header">
        <span className="disb-icon"><IconCalendar /></span>
        <div>
          <h3 className="disb-title">دورة الصرف الشهري</h3>
          {nextDate && (
            <p className="disb-date">
              الموعد القادم: {new Date(nextDate).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long' })}
              {daysUntil !== null && daysUntil >= 0 && (
                <span className="disb-countdown"> ({daysUntil === 0 ? 'اليوم!' : `بعد ${daysUntil} يوم`})</span>
              )}
            </p>
          )}
        </div>
      </div>

      {list ? (
        <div className="disb-status-row">
          <span className="disb-period">
            كشف شهر {list.month}/{list.year}
          </span>
          <span
            className="disb-badge"
            style={{ color: statusInfo?.color, background: statusInfo?.bg }}
          >
            {statusInfo?.label ?? list.status}
          </span>
          {list.status === 'draft' && (
            <Link href={`/disbursements/${list.id}`} className="disb-action-btn">
              اعتماد الكشف ←
            </Link>
          )}
        </div>
      ) : (
        <p className="disb-empty">لم يُولَّد كشف الصرف لهذا الشهر بعد</p>
      )}
    </div>
  );
}

// ── Action list ───────────────────────────────────────────────────────────────
function ActionList({ actions, loading }) {
  if (loading) return <div className="action-skeleton" />;
  if (!actions?.length) return (
    <div className="action-empty">
      <span>✅</span>
      <p>لا توجد إجراءات معلّقة — عمل رائع!</p>
    </div>
  );

  return (
    <ul className="action-list">
      {actions.map((item, i) => (
        <li key={i}>
          <Link href={item.link} className="action-item">
            <span className="action-count">{item.count}</span>
            <span className="action-label">{item.label}</span>
            <span className="action-arrow"><IconArrow /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SupervisorDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/dashboard/supervisor')
      .then(res => setData(res.data))
      .catch(() => setError('تعذّر تحميل بيانات لوحة التحكم'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="sup-dashboard" dir="rtl">

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
          <div className="error-banner">⚠ {error}</div>
        )}

        {/* Stat cards */}
        <div className="stat-grid">
          <StatCard
            label="طلبات تسجيل معلّقة"
            value={data?.pending_registrations_count}
            sub={data ? `${data.pending_orphans_count} يتيم · ${data.pending_families_count} أسرة` : ''}
            icon={<IconClipboard />}
            accent="#F59E0B"
            loading={loading}
            href="/registrations"
          />
          <StatCard
            label="تقارير حفظ معلّقة"
            value={data?.pending_quran_reports_count}
            icon={<IconBook />}
            accent="#3B82F6"
            loading={loading}
            href="/quran-reports"
          />
          <StatCard
            label="كشف الصرف الحالي"
            value={data?.current_disbursement_list ? 1 : 0}
            sub={data?.current_disbursement_list
              ? `شهر ${data.current_disbursement_list.month}/${data.current_disbursement_list.year}`
              : 'لا يوجد كشف بعد'}
            icon={<IconWallet />}
            accent="#8B5CF6"
            loading={loading}
            href="/disbursements"
          />
        </div>

        {/* Disbursement + Actions row */}
        <div className="mid-grid">
          <DisbursementCard
            list={data?.current_disbursement_list}
            nextDate={data?.next_disbursement_date}
            loading={loading}
          />

          <div className="widget">
            <h2 className="widget-title">الإجراءات المطلوبة</h2>
            <ActionList actions={data?.upcoming_actions} loading={loading} />
          </div>
        </div>

      </div>

      <style jsx>{`
        .sup-dashboard { display:flex; flex-direction:column; gap:1.5rem; font-family:'Cairo','Tajawal',sans-serif; }

        .page-header   { display:flex; align-items:flex-start; }
        .page-title    { font-size:1.6rem; font-weight:700; color:#0d3d5c; margin:0 0 .2rem; }
        .page-subtitle { font-size:.82rem; color:#9ca3af; margin:0; }

        .error-banner  { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.75rem 1rem; border-radius:.75rem; font-size:.875rem; }

        /* Stat grid */
        .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        @media(max-width:768px){ .stat-grid{ grid-template-columns:1fr; } }

        .stat-link { text-decoration:none; display:block; }
        .stat-card {
          position:relative; background:#fff; border:1px solid #e5e7eb; border-radius:1rem;
          padding:1.25rem 1.25rem 1.25rem 1.5rem; display:flex; gap:1rem; align-items:flex-start;
          overflow:hidden; transition:box-shadow .15s, transform .15s; cursor:pointer;
        }
        .stat-link:hover .stat-card { box-shadow:0 4px 20px rgba(0,0,0,.08); transform:translateY(-2px); }
        .stat-accent-bar { position:absolute; right:0; top:0; bottom:0; width:4px; background:var(--accent); border-radius:0 1rem 1rem 0; }
        .stat-icon { flex-shrink:0; width:2.5rem; height:2.5rem; border-radius:.625rem; background:color-mix(in srgb, var(--accent) 10%, white); display:flex; align-items:center; justify-content:center; }
        .stat-body { display:flex; flex-direction:column; gap:.15rem; }
        .stat-value { font-size:1.75rem; font-weight:700; color:#0d3d5c; line-height:1; }
        .stat-label { font-size:.8rem; color:#6b7280; font-weight:500; }
        .stat-sub   { font-size:.72rem; color:#9ca3af; }

        /* Mid grid */
        .mid-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        @media(max-width:768px){ .mid-grid{ grid-template-columns:1fr; } }

        .widget { background:#fff; border:1px solid #e5e7eb; border-radius:1rem; padding:1.25rem; }
        .widget-title { font-size:.9rem; font-weight:700; color:#1B5E8C; margin:0 0 1rem; padding-bottom:.75rem; border-bottom:1px solid #f3f4f6; }

        /* Disbursement card */
        .disb-card { background:#fff; border:1px solid #e5e7eb; border-radius:1rem; padding:1.25rem; }
        .disb-skeleton { height:140px; background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:1rem; }
        .disb-header { display:flex; align-items:flex-start; gap:.75rem; margin-bottom:1rem; padding-bottom:.75rem; border-bottom:1px solid #f3f4f6; }
        .disb-icon   { color:#1B5E8C; margin-top:2px; flex-shrink:0; }
        .disb-title  { font-size:.9rem; font-weight:700; color:#1B5E8C; margin:0 0 .2rem; }
        .disb-date   { font-size:.8rem; color:#6b7280; margin:0; }
        .disb-countdown { color:#F59E0B; font-weight:700; }
        .disb-status-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
        .disb-period { font-size:.82rem; color:#374151; font-weight:600; }
        .disb-badge  { font-size:.75rem; font-weight:600; padding:.2rem .65rem; border-radius:999px; }
        .disb-action-btn { margin-right:auto; background:#1B5E8C; color:#fff; font-size:.8rem; font-weight:700; padding:.35rem .85rem; border-radius:.5rem; text-decoration:none; font-family:'Cairo',sans-serif; transition:background .15s; }
        .disb-action-btn:hover { background:#134569; }
        .disb-empty  { font-size:.82rem; color:#9ca3af; margin:0; }

        /* Action list */
        .action-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.4rem; }
        .action-item { display:flex; align-items:center; gap:.75rem; padding:.65rem .85rem; border-radius:.625rem; background:#fafafa; border:1px solid #f3f4f6; text-decoration:none; transition:all .15s; }
        .action-item:hover { background:#f0f7ff; border-color:#bfdbfe; }
        .action-count { min-width:1.6rem; height:1.6rem; border-radius:50%; background:#F59E0B; color:#fff; font-size:.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .action-label { flex:1; font-size:.83rem; color:#374151; font-weight:500; }
        .action-arrow { color:#9ca3af; display:flex; transform:scaleX(-1); }
        .action-skeleton { height:160px; background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:.75rem; }
        .action-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:2rem; color:#9ca3af; font-size:.83rem; text-align:center; }
        .action-empty span { font-size:1.8rem; }
        .action-empty p { margin:0; }

        @keyframes shimmer { 0%{ background-position:200% 0; } 100%{ background-position:-200% 0; } }
      `}</style>
    </AppShell>
  );
}
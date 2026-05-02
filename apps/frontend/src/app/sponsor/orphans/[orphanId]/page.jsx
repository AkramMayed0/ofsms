'use client';

/**
 * Route: /sponsor/orphans/[orphanId]
 * API:   GET /api/sponsor/reports/:orphanId
 *        → { quran_reports: [...], disbursements: [...] }
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import sponsorApi from '../../sponsorApi';
import useSponsorStore from '../../useSponsorStore';

const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const REPORT_STATUS = {
  pending:  { label: 'قيد المراجعة', color: '#92400E', bg: '#FEF3C7', icon: '⏳' },
  approved: { label: 'مقبول',        color: '#065F46', bg: '#ECFDF5', icon: '✅' },
  rejected: { label: 'مرفوض',       color: '#991B1B', bg: '#FEF2F2', icon: '❌' },
};

const DISB_STATUS = {
  draft:               { label: 'مسودة',         color: '#6B7280' },
  supervisor_approved: { label: 'اعتمد المشرف',  color: '#1E40AF' },
  finance_approved:    { label: 'اعتمد المالي',  color: '#5B21B6' },
  released:            { label: 'مُصدَر',         color: '#065F46' },
  rejected:            { label: 'مرفوض',          color: '#991B1B' },
};

export default function SponsorOrphanDetail() {
  const { orphanId } = useParams();
  const router = useRouter();
  const { isAuthenticated, sponsor } = useSponsorStore();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('quran'); // 'quran' | 'disbursements'

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/sponsor/login'); return; }
    sponsorApi.get(`/sponsor/reports/${orphanId}`)
      .then(({ data: res }) => setData(res))
      .catch(() => setError('تعذّر تحميل بيانات هذا اليتيم'))
      .finally(() => setLoading(false));
  }, [orphanId]);

  return (
    <div className="root" dir="rtl">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/sponsor/dashboard" className="back-link">
            ← العودة للقائمة
          </Link>
          <div className="header-brand">
            <span>🤝</span>
            <span className="brand-name">بوابة الكافل</span>
          </div>
          <span className="sponsor-name">{sponsor?.name || ''}</span>
        </div>
      </header>

      <main className="main">
        {error && <div className="err-banner">⚠ {error}</div>}

        {loading ? (
          <LoadingSkeleton />
        ) : !data ? null : (
          <>
            {/* Orphan header card */}
            <div className="orphan-header">
              <div className="orphan-avatar">👦</div>
              <div className="orphan-info">
                <h1 className="orphan-name">تقارير اليتيم</h1>
                <p className="orphan-sub">
                  {data.quran_reports?.length || 0} تقرير حفظ ·{' '}
                  {data.disbursements?.length || 0} دورة صرف
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${tab === 'quran' ? 'active' : ''}`}
                onClick={() => setTab('quran')}
              >
                📖 تقارير حفظ القرآن
                <span className="tab-count">{data.quran_reports?.length || 0}</span>
              </button>
              <button
                className={`tab ${tab === 'disbursements' ? 'active' : ''}`}
                onClick={() => setTab('disbursements')}
              >
                💰 سجل الصرف الشهري
                <span className="tab-count">{data.disbursements?.length || 0}</span>
              </button>
            </div>

            {/* Tab content */}
            {tab === 'quran' && (
              <QuranReportsTab reports={data.quran_reports || []} />
            )}
            {tab === 'disbursements' && (
              <DisbursementsTab disbursements={data.disbursements || []} />
            )}
          </>
        )}
      </main>

      <style jsx>{`
        * { box-sizing:border-box; }
        .root { min-height:100vh; background:#f0f4f8; font-family:'Cairo','Tajawal',sans-serif; }

        .header { background:#fff; border-bottom:1px solid #e5eaf0; box-shadow:0 1px 4px rgba(0,0,0,.06); }
        .header-inner { max-width:900px; margin:0 auto; padding:.9rem 1.5rem; display:flex; align-items:center; justify-content:space-between; }
        .back-link { font-size:.85rem; font-weight:600; color:#2d7a4a; text-decoration:none; }
        .back-link:hover { text-decoration:underline; }
        .header-brand { display:flex; align-items:center; gap:.4rem; font-size:.9rem; font-weight:700; color:#0d3d5c; }
        .sponsor-name { font-size:.78rem; color:#9ca3af; }

        .main { max-width:900px; margin:0 auto; padding:2rem 1.5rem; display:flex; flex-direction:column; gap:1.25rem; }

        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.75rem 1rem; border-radius:.75rem; font-size:.875rem; }

        /* Orphan header */
        .orphan-header { background:linear-gradient(135deg,#1a4a2e,#2d7a4a); border-radius:1rem; padding:1.5rem 1.75rem; display:flex; align-items:center; gap:1.25rem; color:#fff; }
        .orphan-avatar { font-size:2.5rem; width:56px; height:56px; background:rgba(255,255,255,.15); border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .orphan-name { font-size:1.2rem; font-weight:800; margin:0 0 .25rem; }
        .orphan-sub { font-size:.8rem; color:rgba(255,255,255,.7); margin:0; }

        /* Tabs */
        .tabs { display:flex; gap:.5rem; background:#fff; border:1.5px solid #e5eaf0; border-radius:.875rem; padding:.5rem; }
        .tab { flex:1; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.65rem 1rem; border:none; border-radius:.625rem; font-family:'Cairo',sans-serif; font-size:.85rem; font-weight:600; color:#6b7280; background:none; cursor:pointer; transition:all .15s; }
        .tab.active { background:#f0fdf4; color:#2d7a4a; }
        .tab:hover:not(.active) { background:#f9fafb; }
        .tab-count { background:#e5e7eb; color:#374151; font-size:.68rem; font-weight:700; padding:.1rem .45rem; border-radius:999px; }
        .tab.active .tab-count { background:#2d7a4a; color:#fff; }
      `}</style>
    </div>
  );
}

// ── Quran Reports Tab ─────────────────────────────────────────────────────────
function QuranReportsTab({ reports }) {
  if (!reports.length) {
    return (
      <div className="empty-state">
        <span>📖</span>
        <p>لا توجد تقارير حفظ بعد</p>
      </div>
    );
  }

  return (
    <div className="reports-grid">
      {reports.map(r => {
        const cfg = REPORT_STATUS[r.status] || REPORT_STATUS.pending;
        return (
          <div key={r.id} className="report-card">
            <div className="report-top">
              <div className="report-period">
                <span className="period-month">{ARABIC_MONTHS[r.month]}</span>
                <span className="period-year">{r.year}</span>
              </div>
              <span className="report-badge" style={{ color:cfg.color, background:cfg.bg }}>
                {cfg.icon} {cfg.label}
              </span>
            </div>

            <div className="report-juz">
              <span className="juz-num">{r.juz_memorized}</span>
              <span className="juz-lbl">جزء محفوظ هذا الشهر</span>
            </div>

            {r.supervisor_notes && r.status === 'rejected' && (
              <div className="report-notes">
                <span>📝</span>
                <span>{r.supervisor_notes}</span>
              </div>
            )}

            <div className="report-date">
              {new Date(r.submitted_at).toLocaleDateString('ar-YE', { day:'numeric', month:'short', year:'numeric' })}
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .reports-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:1rem; }
        .report-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:.875rem; padding:1rem 1.1rem; display:flex; flex-direction:column; gap:.75rem; }
        .report-top { display:flex; align-items:center; justify-content:space-between; }
        .report-period { display:flex; flex-direction:column; }
        .period-month { font-size:.95rem; font-weight:700; color:#0d3d5c; line-height:1; }
        .period-year { font-size:.72rem; color:#9ca3af; }
        .report-badge { font-size:.72rem; font-weight:700; padding:.2rem .6rem; border-radius:999px; }
        .report-juz { display:flex; align-items:baseline; gap:.4rem; }
        .juz-num { font-size:2rem; font-weight:800; color:#2d7a4a; line-height:1; }
        .juz-lbl { font-size:.72rem; color:#9ca3af; }
        .report-notes { display:flex; align-items:flex-start; gap:.4rem; background:#fef2f2; border-radius:.5rem; padding:.5rem .65rem; font-size:.75rem; color:#991b1b; }
        .report-date { font-size:.7rem; color:#9ca3af; padding-top:.25rem; border-top:1px solid #f3f4f6; }
        .empty-state { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:3rem; text-align:center; color:#9ca3af; display:flex; flex-direction:column; align-items:center; gap:.5rem; font-size:.85rem; }
        .empty-state span { font-size:2.5rem; }
      `}</style>
    </div>
  );
}

// ── Disbursements Tab ─────────────────────────────────────────────────────────
function DisbursementsTab({ disbursements }) {
  if (!disbursements.length) {
    return (
      <div className="empty-state">
        <span>💰</span>
        <p>لا توجد بيانات صرف بعد</p>
      </div>
    );
  }

  const totalReleased = disbursements
    .filter(d => d.list_status === 'released' && d.included)
    .reduce((s, d) => s + parseFloat(d.amount), 0);

  return (
    <div className="disb-section">
      <div className="disb-summary">
        <span className="summary-label">إجمالي المبالغ المُصدَرة:</span>
        <span className="summary-amount">{totalReleased.toLocaleString('ar-YE')} ريال</span>
      </div>

      <div className="disb-table-wrap">
        <table className="disb-table">
          <thead>
            <tr>
              <th>الشهر</th>
              <th>المبلغ</th>
              <th>حالة الكشف</th>
              <th>مُدرَج</th>
              <th>تأكيد الاستلام</th>
            </tr>
          </thead>
          <tbody>
            {disbursements.map((d, i) => {
              const cfg = DISB_STATUS[d.list_status] || DISB_STATUS.draft;
              return (
                <tr key={i}>
                  <td>{ARABIC_MONTHS[d.month]} {d.year}</td>
                  <td className="td-amount">{parseFloat(d.amount).toLocaleString('ar-YE')} ريال</td>
                  <td><span className="disb-status" style={{ color:cfg.color }}>{cfg.label}</span></td>
                  <td>
                    {d.included
                      ? <span className="badge-yes">✓ نعم</span>
                      : <span className="badge-no" title={d.exclusion_reason}>✗ لا</span>
                    }
                  </td>
                  <td>
                    {d.receipt_confirmed_at
                      ? <span className="badge-yes">✓ {new Date(d.receipt_confirmed_at).toLocaleDateString('ar-YE', { day:'numeric', month:'short' })}</span>
                      : <span className="badge-pending">بانتظار</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .disb-section { display:flex; flex-direction:column; gap:1rem; }
        .disb-summary { background:#f0fdf4; border:1.5px solid #6ee7b7; border-radius:.75rem; padding:.85rem 1.1rem; display:flex; align-items:center; justify-content:space-between; }
        .summary-label { font-size:.85rem; font-weight:600; color:#065F46; }
        .summary-amount { font-size:1.1rem; font-weight:800; color:#065F46; }
        .disb-table-wrap { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; overflow:hidden; }
        .disb-table { width:100%; border-collapse:collapse; font-size:.8rem; }
        .disb-table th { text-align:right; padding:.65rem .85rem; font-size:.72rem; font-weight:700; color:#9ca3af; border-bottom:2px solid #f3f4f6; white-space:nowrap; background:#fafafa; }
        .disb-table td { padding:.7rem .85rem; color:#374151; border-bottom:1px solid #f9fafb; }
        .disb-table tr:last-child td { border-bottom:none; }
        .disb-table tr:hover td { background:#fafafa; }
        .td-amount { font-weight:700; color:#0d3d5c; }
        .disb-status { font-size:.75rem; font-weight:600; }
        .badge-yes { background:#ECFDF5; color:#065F46; font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:999px; }
        .badge-no { background:#fef2f2; color:#991b1b; font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:999px; cursor:help; }
        .badge-pending { background:#f3f4f6; color:#6b7280; font-size:.72rem; font-weight:600; padding:.15rem .5rem; border-radius:999px; }
        .empty-state { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:3rem; text-align:center; color:#9ca3af; display:flex; flex-direction:column; align-items:center; gap:.5rem; font-size:.85rem; }
        .empty-state span { font-size:2.5rem; }
      `}</style>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ height:100, borderRadius:'1rem', background:'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      <div style={{ height:48, borderRadius:'.875rem', background:'#e5e7eb' }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height:140, borderRadius:'.875rem', background:'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
        ))}
      </div>
    </div>
  );
}

'use client';

/**
 * page.jsx
 * Route:  /governorates  (GM only)
 * Task:   feature/ui-governorate-drill
 *
 * Two-panel layout:
 *   Right panel — list of all 22 Yemeni governorates as clickable cards,
 *                 each showing orphan count + a relative bar.
 *   Left panel  — orphan drill-down table for the selected governorate,
 *                 with summary stats, status breakdown, and full orphan list.
 *
 * API:
 *   GET /api/governorates                   → list of governorates
 *   GET /api/governorates/:id/orphans       → orphans + summary for one governorate
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  under_review:      { label: 'قيد المراجعة',  color: '#f59e0b', bg: '#fffbeb' },
  under_marketing:   { label: 'تحت التسويق',    color: '#3b82f6', bg: '#eff6ff' },
  under_sponsorship: { label: 'تحت الكفالة',    color: '#10b981', bg: '#ecfdf5' },
  rejected:          { label: 'مرفوض',           color: '#ef4444', bg: '#fef2f2' },
  inactive:          { label: 'غير نشط',         color: '#9ca3af', bg: '#f9fafb' },
};

const GENDER_MAP = { male: 'ذكر', female: 'أنثى' };

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

const formatAmount = (n) =>
  n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.2rem .65rem', borderRadius: '2rem',
      fontSize: '.72rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}25`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Skel({ w, h, r = 4 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── GovernorateCard ────────────────────────────────────────────────────────────

function GovernorateCard({ gov, count, maxCount, isSelected, onClick, loading }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div
      className={`gov-card ${isSelected ? 'gov-card-selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-pressed={isSelected}
    >
      <div className="gov-card-top">
        <span className="gov-name">{gov.name_ar}</span>
        <span className="gov-count" style={{ color: isSelected ? '#fff' : '#1B5E8C' }}>
          {loading ? '…' : count}
        </span>
      </div>
      <div className="gov-bar-track">
        <div
          className="gov-bar-fill"
          style={{
            width: loading ? '0%' : `${pct}%`,
            background: isSelected ? 'rgba(255,255,255,0.6)' : 'linear-gradient(90deg,#1B5E8C,#2E7EB8)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── SummaryStrip ───────────────────────────────────────────────────────────────

function SummaryStrip({ summary }) {
  const items = [
    { label: 'إجمالي الأيتام',    value: summary.total,              color: '#1B5E8C' },
    { label: 'تحت الكفالة',       value: summary.under_sponsorship,  color: '#10b981' },
    { label: 'تحت التسويق',       value: summary.under_marketing,    color: '#3b82f6' },
    { label: 'قيد المراجعة',      value: summary.under_review,       color: '#f59e0b' },
    { label: 'موهوبون',           value: summary.gifted,             color: '#8b5cf6' },
    { label: 'إجمالي الصرف الشهري', value: formatAmount(summary.total_monthly_value), color: '#059669' },
  ];

  return (
    <div className="summary-strip">
      {items.map((item) => (
        <div key={item.label} className="summary-item">
          <span className="summary-val" style={{ color: item.color }}>{item.value ?? 0}</span>
          <span className="summary-lbl">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── OrphanTable ────────────────────────────────────────────────────────────────

function OrphanTable({ orphans, search }) {
  const filtered = orphans.filter((o) =>
    !search ||
    o.full_name?.includes(search) ||
    o.sponsor_name?.includes(search) ||
    o.agent_name?.includes(search)
  );

  if (filtered.length === 0) {
    return (
      <div className="table-empty">
        <span>🔍</span>
        <p>لا توجد نتائج مطابقة</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="orphan-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>العمر</th>
            <th>الجنس</th>
            <th>الحالة</th>
            <th>الكافل</th>
            <th>المبلغ</th>
            <th>المندوب</th>
            <th>آخر تقرير</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id} className="orphan-row">
              <td>
                <div className="name-cell">
                  <div className="o-avatar">{o.full_name?.charAt(0) || '؟'}</div>
                  <div>
                    <div className="o-name">{o.full_name}</div>
                    {o.is_gifted && <span className="gifted-tag">🌟 موهوب</span>}
                  </div>
                </div>
              </td>
              <td className="muted">{calcAge(o.date_of_birth)}</td>
              <td className="muted">{GENDER_MAP[o.gender] || '—'}</td>
              <td><StatusBadge status={o.status} /></td>
              <td className="muted">{o.sponsor_name || '—'}</td>
              <td className="muted">{formatAmount(o.monthly_amount)}</td>
              <td className="muted">{o.agent_name || '—'}</td>
              <td>
                {o.latest_report_status ? (
                  <div>
                    <StatusBadge status={
                      o.latest_report_status === 'approved' ? 'under_sponsorship' :
                      o.latest_report_status === 'rejected' ? 'rejected' : 'under_review'
                    } />
                    <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.2rem' }}>
                      {o.latest_report_month}/{o.latest_report_year}
                      {o.latest_juz_memorized != null && ` · ${o.latest_juz_memorized} جزء`}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '.75rem', color: '#d1d5db' }}>لا يوجد</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GovernoratesDrillPage() {
  const router = useRouter();

  const [governorates, setGovernorates]   = useState([]);
  const [orphanCounts, setOrphanCounts]   = useState({}); // govId → count
  const [govLoading,   setGovLoading]     = useState(true);
  const [govError,     setGovError]       = useState('');

  const [selectedGov,  setSelectedGov]    = useState(null);  // { id, name_ar }
  const [drillData,    setDrillData]      = useState(null);  // { governorate, summary, orphans }
  const [drillLoading, setDrillLoading]   = useState(false);
  const [drillError,   setDrillError]     = useState('');

  const [search, setSearch] = useState('');

  // Load governorates + orphan counts from the GM dashboard
  useEffect(() => {
    Promise.all([
      api.get('/governorates'),
      api.get('/dashboard/gm'),
    ])
      .then(([govRes, dashRes]) => {
        const govs = govRes.data.data || [];
        setGovernorates(govs);

        // Build count map from dashboard data
        const perGov = dashRes.data.orphans_per_governorate || [];
        const countMap = {};
        perGov.forEach((g) => {
          const match = govs.find((gov) => gov.name_ar === g.governorate_ar);
          if (match) countMap[match.id] = parseInt(g.count);
        });
        setOrphanCounts(countMap);
      })
      .catch(() => setGovError('تعذّر تحميل بيانات المحافظات.'))
      .finally(() => setGovLoading(false));
  }, []);

  // Load drill-down when a governorate is clicked
  const handleGovClick = (gov) => {
    if (selectedGov?.id === gov.id) return; // already selected
    setSelectedGov(gov);
    setSearch('');
    setDrillData(null);
    setDrillError('');
    setDrillLoading(true);
    api.get(`/governorates/${gov.id}/orphans`)
      .then(({ data }) => setDrillData(data))
      .catch(() => setDrillError('تعذّر تحميل بيانات الأيتام لهذه المحافظة.'))
      .finally(() => setDrillLoading(false));
  };

  const maxCount = Math.max(...Object.values(orphanCounts), 1);
  const totalOrphans = Object.values(orphanCounts).reduce((s, c) => s + c, 0);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* ── Page header ── */}
        <div className="page-top">
          <div>
            <h1 className="page-title">تحليلات المحافظات</h1>
            <p className="page-sub">
              {govLoading
                ? 'جارٍ التحميل…'
                : `${governorates.length} محافظة · ${totalOrphans} يتيم إجمالاً`}
            </p>
          </div>
          <button className="btn-ghost" onClick={() => router.push('/reports')}>
            📄 تصدير تقرير ←
          </button>
        </div>

        {govError && <div className="err-banner">⚠ {govError}</div>}

        {/* ── Main split layout ── */}
        <div className={`split ${selectedGov ? 'split-open' : ''}`}>

          {/* ── Right panel: governorate list ── */}
          <div className="gov-panel">
            <div className="gov-panel-head">
              <span className="panel-title">المحافظات</span>
              <span className="panel-hint">اضغط لعرض التفاصيل</span>
            </div>
            <div className="gov-list">
              {govLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="gov-card" style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Skel w={100} h={13} />
                        <Skel w={24} h={13} />
                      </div>
                      <Skel w="100%" h={5} r={3} />
                    </div>
                  ))
                : governorates.map((gov) => (
                    <GovernorateCard
                      key={gov.id}
                      gov={gov}
                      count={orphanCounts[gov.id] || 0}
                      maxCount={maxCount}
                      isSelected={selectedGov?.id === gov.id}
                      onClick={() => handleGovClick(gov)}
                    />
                  ))}
            </div>
          </div>

          {/* ── Left panel: drill-down ── */}
          {selectedGov && (
            <div className="drill-panel">

              {/* Drill header */}
              <div className="drill-head">
                <div>
                  <p className="drill-suptitle">تفاصيل المحافظة</p>
                  <h2 className="drill-title">{selectedGov.name_ar}</h2>
                </div>
                <button
                  className="drill-close"
                  onClick={() => { setSelectedGov(null); setDrillData(null); }}
                  aria-label="إغلاق"
                >✕</button>
              </div>

              {drillError && <div className="err-banner" style={{ margin: '0 1.5rem 1rem' }}>⚠ {drillError}</div>}

              {/* Summary strip skeleton */}
              {drillLoading && (
                <div className="summary-strip">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="summary-item">
                      <Skel w={40} h={22} />
                      <Skel w={70} h={11} />
                    </div>
                  ))}
                </div>
              )}

              {/* Summary strip loaded */}
              {!drillLoading && drillData && (
                <SummaryStrip summary={drillData.summary} />
              )}

              {/* Search bar */}
              {drillData && drillData.orphans.length > 0 && (
                <div className="drill-search">
                  <span className="dsearch-icon">🔍</span>
                  <input
                    className="dsearch-inp"
                    placeholder="ابحث بالاسم أو الكافل أو المندوب…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="dsearch-clear" onClick={() => setSearch('')}>✕</button>
                  )}
                </div>
              )}

              {/* Table skeleton */}
              {drillLoading && (
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Skel w={32} h={32} r={16} />
                      <div style={{ flex: 1 }}>
                        <Skel w="50%" h={13} />
                        <div style={{ marginTop: 4 }}><Skel w="30%" h={11} /></div>
                      </div>
                      <Skel w={80} h={22} r={11} />
                    </div>
                  ))}
                </div>
              )}

              {/* Table loaded */}
              {!drillLoading && drillData && (
                drillData.orphans.length === 0 ? (
                  <div className="drill-empty">
                    <span>👦</span>
                    <p>لا يوجد أيتام مسجّلون في هذه المحافظة</p>
                  </div>
                ) : (
                  <>
                    <OrphanTable orphans={drillData.orphans} search={search} />
                    <div className="drill-footer">
                      {drillData.orphans.length} يتيم في محافظة {selectedGov.name_ar}
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ── Empty state when nothing selected ── */}
          {!selectedGov && !govLoading && (
            <div className="empty-drill">
              <div className="empty-drill-icon">🗺️</div>
              <p className="empty-drill-title">اختر محافظة لعرض تفاصيلها</p>
              <p className="empty-drill-sub">
                اضغط على أي محافظة في القائمة لعرض الأيتام المسجّلين فيها مع كامل بياناتهم
              </p>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          padding-bottom: 3rem;
        }

        .page-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .page-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0 0 .2rem;
        }
        .page-sub { font-size: .83rem; color: #9ca3af; margin: 0; }

        .err-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: .75rem 1rem;
          border-radius: .75rem;
          font-size: .85rem;
        }

        /* ── Split layout ─────────────────────────────────────────────── */
        .split {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.25rem;
          align-items: start;
          min-height: 500px;
        }

        /* ── Governorate panel ────────────────────────────────────────── */
        .gov-panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          position: sticky;
          top: 1rem;
          max-height: calc(100vh - 180px);
          display: flex;
          flex-direction: column;
        }

        .gov-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: .85rem 1.1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .panel-title {
          font-size: .85rem;
          font-weight: 800;
          color: #0d3d5c;
        }
        .panel-hint {
          font-size: .72rem;
          color: #94a3b8;
        }

        .gov-list {
          overflow-y: auto;
          flex: 1;
          padding: .5rem;
          display: flex;
          flex-direction: column;
          gap: .3rem;
        }

        .gov-card {
          padding: .65rem .85rem;
          border-radius: .625rem;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all .15s;
          background: #fafafa;
        }
        .gov-card:hover {
          background: #f0f7ff;
          border-color: #bfdbfe;
        }
        .gov-card-selected {
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c) !important;
          border-color: transparent !important;
        }
        .gov-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: .45rem;
        }
        .gov-name {
          font-size: .82rem;
          font-weight: 700;
          color: #374151;
        }
        .gov-card-selected .gov-name { color: #fff; }
        .gov-count {
          font-size: .85rem;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
        }
        .gov-bar-track {
          height: 5px;
          background: rgba(0,0,0,.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .gov-card-selected .gov-bar-track {
          background: rgba(255,255,255,.2);
        }
        .gov-bar-fill {
          height: 100%;
          border-radius: 999px;
        }

        /* ── Drill-down panel ─────────────────────────────────────────── */
        .drill-panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: panelIn .2s ease;
          max-height: calc(100vh - 180px);
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: none; }
        }

        .drill-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.1rem 1.5rem;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          color: #fff;
          flex-shrink: 0;
        }
        .drill-suptitle {
          font-size: .72rem;
          color: rgba(255,255,255,.6);
          text-transform: uppercase;
          letter-spacing: .06em;
          margin: 0 0 .2rem;
          font-weight: 700;
        }
        .drill-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .drill-close {
          background: rgba(255,255,255,.15);
          border: none;
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: .75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .12s;
        }
        .drill-close:hover { background: rgba(255,255,255,.25); }

        /* ── Summary strip ────────────────────────────────────────────── */
        .summary-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .2rem;
          padding: .85rem .5rem;
          border-left: 1px solid #f0f4f8;
        }
        .summary-item:last-child { border-left: none; }
        .summary-val {
          font-size: 1rem;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
        }
        .summary-lbl {
          font-size: .65rem;
          color: #9ca3af;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
        }

        /* ── Search ───────────────────────────────────────────────────── */
        .drill-search {
          position: relative;
          display: flex;
          align-items: center;
          padding: .75rem 1rem;
          border-bottom: 1px solid #f0f4f8;
          flex-shrink: 0;
        }
        .dsearch-icon {
          position: absolute;
          right: 1.6rem;
          font-size: .85rem;
          pointer-events: none;
          color: #9ca3af;
        }
        .dsearch-inp {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: .625rem;
          padding: .55rem .85rem .55rem 2.2rem;
          padding-right: 2.4rem;
          font-size: .85rem;
          font-family: 'Cairo', sans-serif;
          color: #1f2937;
          background: #fafafa;
          outline: none;
          box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .dsearch-inp:focus {
          border-color: #1B5E8C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(27,94,140,.1);
        }
        .dsearch-clear {
          position: absolute;
          left: 1.4rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: .8rem;
        }

        /* ── Orphan table ─────────────────────────────────────────────── */
        .table-scroll {
          overflow: auto;
          flex: 1;
        }
        .orphan-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }
        .orphan-table thead tr { background: #f8fafc; }
        .orphan-table th {
          padding: .75rem 1rem;
          text-align: right;
          font-size: .72rem;
          font-weight: 700;
          color: #6b7a8d;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: #f8fafc;
          z-index: 1;
        }
        .orphan-table td {
          padding: .75rem 1rem;
          font-size: .82rem;
          border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .orphan-row { transition: background .1s; }
        .orphan-row:hover { background: #f8fbff; }
        .orphan-row:last-child td { border-bottom: none; }

        .name-cell { display: flex; align-items: center; gap: .6rem; }
        .o-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .8rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .o-name { font-weight: 700; color: #1f2937; font-size: .82rem; }
        .gifted-tag {
          display: inline-block;
          font-size: .65rem;
          font-weight: 600;
          color: #f59e0b;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 2rem;
          padding: .1rem .4rem;
          margin-top: .1rem;
        }
        .muted { color: #6b7a8d; }

        .table-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 3rem;
          color: #9ca3af;
          font-size: .85rem;
        }
        .table-empty span { font-size: 2rem; }

        .drill-footer {
          padding: .65rem 1rem;
          font-size: .75rem;
          color: #9ca3af;
          border-top: 1px solid #f0f4f8;
          flex-shrink: 0;
        }

        .drill-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 4rem 2rem;
          color: #9ca3af;
          font-size: .88rem;
          font-weight: 600;
        }
        .drill-empty span { font-size: 2.5rem; }

        /* ── Empty state (nothing selected) ──────────────────────────── */
        .empty-drill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          gap: .75rem;
          text-align: center;
          padding: 2rem;
        }
        .empty-drill-icon { font-size: 3.5rem; opacity: .6; }
        .empty-drill-title { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; }
        .empty-drill-sub { font-size: .83rem; color: #9ca3af; margin: 0; max-width: 320px; line-height: 1.7; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .65rem 1.25rem;
          background: none;
          color: #1B5E8C;
          font-family: 'Cairo', sans-serif;
          font-size: .88rem;
          font-weight: 600;
          border: 1.5px solid #dde5f0;
          border-radius: .75rem;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .btn-ghost:hover { background: #f0f7ff; border-color: #1B5E8C; }

        /* ── Shimmer animation ────────────────────────────────────────── */
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .split {
            grid-template-columns: 1fr;
          }
          .gov-panel {
            position: static;
            max-height: 280px;
          }
          .drill-panel {
            max-height: none;
          }
          .summary-strip {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 600px) {
          .page-top { flex-direction: column; }
          .summary-strip { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </AppShell>
  );
}

'use client';

/**
 * page.jsx
 * Route:  /my-orphans  (Agent only)
 * Task:   feature/ui-agent-my-orphans
 *
 * Shows the agent's assigned orphans in a searchable, filterable table.
 * Clicking a row opens a slide-in detail drawer with full orphan info.
 * Links to /orphans/new for registration.
 */

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_MAP = {
  under_review:       { label: 'قيد المراجعة',   color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' },
  under_marketing:    { label: 'تحت التسويق',     color: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6' },
  under_sponsorship:  { label: 'تحت الكفالة',     color: '#10b981', bg: '#ecfdf5', dot: '#10b981' },
  rejected:           { label: 'مرفوض',            color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
  inactive:           { label: 'غير نشط',          color: '#9ca3af', bg: '#f9fafb', dot: '#9ca3af' },
};

const GENDER_MAP = { male: 'ذكر', female: 'أنثى' };

const RELATION_MAP = {
  uncle:          'عم',
  maternal_uncle: 'خال',
  grandfather:    'جد',
  sibling:        'أخ / أخت',
  other:          'أخرى',
};

const ALL_STATUSES = Object.keys(STATUS_MAP);

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} سنة`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' });
};

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.75rem', borderRadius: '2rem',
      fontSize: '0.75rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── DetailDrawer ───────────────────────────────────────────────────────────────

function DetailDrawer({ orphan, onClose }) {
  const [docs, setDocs]       = useState([]);
  const [docsLoading, setDL]  = useState(true);

  useEffect(() => {
    if (!orphan) return;
    setDL(true);
    api.get(`/orphans/${orphan.id}`)
      .then(({ data }) => setDocs(data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setDL(false));
  }, [orphan?.id]);

  if (!orphan) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="backdrop" onClick={onClose} />

      {/* Drawer */}
      <aside className="drawer" dir="rtl">
        {/* Header */}
        <div className="drawer-head">
          <div>
            <h2 className="drawer-name">{orphan.full_name}</h2>
            <StatusBadge status={orphan.status} />
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="drawer-body">

          {/* Info grid */}
          <div className="info-section">
            <h3 className="info-title">البيانات الأساسية</h3>
            <div className="info-grid">
              <InfoRow label="العمر"        value={calcAge(orphan.date_of_birth)} />
              <InfoRow label="تاريخ الميلاد" value={formatDate(orphan.date_of_birth)} />
              <InfoRow label="الجنس"        value={GENDER_MAP[orphan.gender] || '—'} />
              <InfoRow label="المحافظة"     value={orphan.governorate_ar || '—'} />
              <InfoRow label="اسم الوصي"   value={orphan.guardian_name || '—'} />
              <InfoRow label="صلة الوصي"   value={RELATION_MAP[orphan.guardian_relation] || '—'} />
              <InfoRow label="تاريخ التسجيل" value={formatDate(orphan.created_at)} />
              {orphan.is_gifted && <InfoRow label="موهوب" value="✅ نعم" highlight />}
            </div>
          </div>

          {/* Sponsorship info */}
          {orphan.status === 'under_sponsorship' && (
            <div className="info-section">
              <h3 className="info-title">بيانات الكفالة</h3>
              <div className="info-grid">
                <InfoRow label="اسم الكافل"    value={orphan.sponsor_name || '—'} />
                <InfoRow label="المبلغ الشهري" value={orphan.monthly_amount ? `${orphan.monthly_amount} ر.ي` : '—'} />
                <InfoRow label="تاريخ البداية" value={formatDate(orphan.sponsorship_start)} />
              </div>
            </div>
          )}

          {/* Rejection notes */}
          {orphan.status === 'rejected' && orphan.notes && (
            <div className="rejection-box">
              <span className="rejection-icon">⚠</span>
              <div>
                <strong>سبب الرفض</strong>
                <p>{orphan.notes}</p>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="info-section">
            <h3 className="info-title">المستندات المرفوعة</h3>
            {docsLoading ? (
              <p className="muted">جارٍ التحميل…</p>
            ) : docs.length === 0 ? (
              <p className="muted">لا توجد مستندات مرفوعة</p>
            ) : (
              <div className="doc-list">
                {docs.map((d) => (
                  <div key={d.id} className="doc-chip">
                    <span>📄</span>
                    <span className="doc-name">{d.original_name || d.doc_type}</span>
                    <span className="doc-date">{formatDate(d.uploaded_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="drawer-foot">
          {orphan.status === 'rejected' && (
            <a href={`/orphans/${orphan.id}/edit`} className="btn-primary-sm">
              تعديل وإعادة الإرسال
            </a>
          )}
          <button className="btn-ghost-sm" onClick={onClose}>إغلاق</button>
        </div>
      </aside>

      <style jsx>{`
        .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:40; animation:fadeIn .2s ease; }
        .drawer { position:fixed; top:0; left:0; width:420px; max-width:95vw; height:100vh; background:#fff; z-index:50; display:flex; flex-direction:column; box-shadow:-4px 0 24px rgba(0,0,0,0.12); animation:slideIn .25s ease; }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }

        .drawer-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.5rem; border-bottom:1px solid #f0f4f8; }
        .drawer-name { font-size:1.15rem; font-weight:800; color:#0d3d5c; margin:0 0 .5rem; }
        .drawer-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem .4rem; border-radius:6px; transition:all .15s; flex-shrink:0; }
        .drawer-close:hover { background:#f3f4f6; color:#374151; }

        .drawer-body { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
        .drawer-foot { padding:1rem 1.5rem; border-top:1px solid #f0f4f8; display:flex; gap:.75rem; justify-content:flex-end; }

        .info-section {}
        .info-title { font-size:.78rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin:0 0 .75rem; }
        .info-grid { display:flex; flex-direction:column; gap:.5rem; }

        .rejection-box { display:flex; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:1rem; }
        .rejection-icon { font-size:1.1rem; flex-shrink:0; }
        .rejection-box strong { display:block; font-size:.85rem; color:#b91c1c; margin-bottom:.25rem; }
        .rejection-box p { font-size:.82rem; color:#dc2626; margin:0; line-height:1.6; }

        .muted { font-size:.83rem; color:#94a3b8; margin:0; }
        .doc-list { display:flex; flex-direction:column; gap:.4rem; }
        .doc-chip { display:flex; align-items:center; gap:.5rem; padding:.45rem .65rem; background:#f8fafc; border:1px solid #e5eaf0; border-radius:.5rem; font-size:.78rem; }
        .doc-name { flex:1; color:#374151; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr; text-align:left; }
        .doc-date { color:#94a3b8; flex-shrink:0; }

        .btn-primary-sm { display:inline-flex; align-items:center; padding:.55rem 1.1rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:700; border:none; border-radius:.625rem; cursor:pointer; text-decoration:none; transition:all .15s; }
        .btn-primary-sm:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); }
        .btn-ghost-sm { display:inline-flex; align-items:center; padding:.55rem 1.1rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.625rem; cursor:pointer; transition:all .15s; }
        .btn-ghost-sm:hover { background:#f0f7ff; border-color:#1B5E8C; }
      `}</style>
    </>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.35rem 0', borderBottom:'1px solid #f8fafc' }}>
      <span style={{ fontSize:'.8rem', color:'#6b7a8d', fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:'.83rem', color: highlight ? '#10b981' : '#1f2937', fontWeight: highlight ? 700 : 600 }}>{value}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function MyOrphansPage() {
  const router = useRouter();

  const [orphans,   setOrphans]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState(null); // orphan for drawer
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch orphans
  useEffect(() => {
    setLoading(true);
    api.get('/orphans')
      .then(({ data }) => setOrphans(data.orphans || []))
      .catch(() => setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter + search
  const filtered = orphans.filter((o) => {
    const matchSearch = !search ||
      o.full_name?.includes(search) ||
      o.governorate_ar?.includes(search) ||
      o.guardian_name?.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Status counts for filter tabs
  const counts = orphans.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">أيتامي</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${orphans.length} يتيم مسجّل`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => router.push('/orphans/new')}>
            + تسجيل يتيم جديد
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-inp"
              placeholder="ابحث بالاسم أو المحافظة أو الوصي…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="filter-tabs">
            <button
              className={`ftab ${filterStatus === 'all' ? 'ftab-active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              الكل <span className="ftab-count">{orphans.length}</span>
            </button>
            {ALL_STATUSES.map((s) => counts[s] ? (
              <button
                key={s}
                className={`ftab ${filterStatus === s ? 'ftab-active' : ''}`}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              >
                {STATUS_MAP[s].label}
                <span className="ftab-count">{counts[s]}</span>
              </button>
            ) : null)}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="err-banner">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="skeleton-wrap">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="skeleton-row">
                <div className="skel skel-name" />
                <div className="skel skel-gov" />
                <div className="skel skel-badge" />
                <div className="skel skel-date" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <div className="empty-ico">👦</div>
            <h3 className="empty-title">
              {search || filterStatus !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد أيتام مسجّلون بعد'}
            </h3>
            <p className="empty-sub">
              {search || filterStatus !== 'all'
                ? 'جرّب تغيير معايير البحث أو الفلتر'
                : 'ابدأ بتسجيل يتيم جديد'}
            </p>
            {!search && filterStatus === 'all' && (
              <button className="btn-primary" onClick={() => router.push('/orphans/new')}>
                + تسجيل يتيم جديد
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم الكامل</th>
                  <th>المحافظة</th>
                  <th>العمر</th>
                  <th>الجنس</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="trow"
                    onClick={() => setSelected(o)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(o)}
                    aria-label={`عرض تفاصيل ${o.full_name}`}
                  >
                    <td>
                      <div className="name-cell">
                        <div className="name-avatar">
                          {o.full_name?.charAt(0) || '؟'}
                        </div>
                        <div>
                          <div className="name-text">{o.full_name}</div>
                          {o.is_gifted && (
                            <span className="gifted-tag">🌟 موهوب</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="cell-muted">{o.governorate_ar || '—'}</td>
                    <td className="cell-muted">{calcAge(o.date_of_birth)}</td>
                    <td className="cell-muted">{GENDER_MAP[o.gender] || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="cell-muted">{formatDate(o.created_at)}</td>
                    <td>
                      <button className="view-btn" onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                        عرض →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Result count */}
            <div className="table-footer">
              عرض {filtered.length} من {orphans.length} يتيم
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <DetailDrawer orphan={selected} onClose={() => setSelected(null)} />

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page { max-width:1100px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        /* ── Toolbar ──────────────────────────────────────────────────── */
        .toolbar { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.25rem; }
        .search-wrap { position:relative; display:flex; align-items:center; }
        .search-icon { position:absolute; right:.85rem; font-size:.9rem; pointer-events:none; }
        .search-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.65rem .9rem .65rem 2.5rem; padding-right:2.4rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .search-inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position:absolute; left:.75rem; background:none; border:none; cursor:pointer; color:#9ca3af; font-size:.85rem; padding:.2rem; transition:color .15s; }
        .search-clear:hover { color:#374151; }

        /* ── Filter tabs ──────────────────────────────────────────────── */
        .filter-tabs { display:flex; gap:.4rem; flex-wrap:wrap; }
        .ftab { display:inline-flex; align-items:center; gap:.35rem; padding:.4rem .85rem; border:1.5px solid #e5eaf0; border-radius:2rem; font-size:.78rem; font-weight:600; color:#6b7280; background:#fff; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; }
        .ftab:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .ftab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .ftab-active .ftab-count { background:rgba(255,255,255,.25); color:#fff; }
        .ftab-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 4px; border-radius:2rem; background:#f0f4f8; color:#6b7280; font-size:.7rem; font-weight:700; }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:500; margin-bottom:1rem; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skeleton-wrap { display:flex; flex-direction:column; gap:.5rem; }
        .skeleton-row { display:flex; gap:1rem; padding:1rem 1.25rem; background:#fff; border:1px solid #e5eaf0; border-radius:.75rem; align-items:center; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:.375rem; }
        .skel-name { width:160px; height:16px; }
        .skel-gov  { width:80px;  height:14px; }
        .skel-badge{ width:90px;  height:24px; border-radius:2rem; }
        .skel-date { width:100px; height:14px; margin-right:auto; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        /* ── Empty ────────────────────────────────────────────────────── */
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; text-align:center; gap:.75rem; }
        .empty-ico { font-size:3.5rem; }
        .empty-title { font-size:1.1rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        /* ── Table ────────────────────────────────────────────────────── */
        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.85rem 1.25rem; text-align:right; font-size:.75rem; font-weight:700; color:#6b7a8d; white-space:nowrap; border-bottom:1px solid #e5eaf0; }
        .table td { padding:.9rem 1.25rem; font-size:.85rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow:last-child td { border-bottom:none; }
        .trow:focus { outline:2px solid #1B5E8C; outline-offset:-2px; }

        .name-cell { display:flex; align-items:center; gap:.75rem; }
        .name-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.9rem; font-weight:700; flex-shrink:0; }
        .name-text { font-weight:700; color:#1f2937; }
        .gifted-tag { display:inline-block; font-size:.68rem; font-weight:600; color:#f59e0b; background:#fffbeb; border:1px solid #fde68a; border-radius:2rem; padding:.1rem .45rem; margin-top:.15rem; }
        .cell-muted { color:#6b7a8d; }

        .view-btn { background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap; }
        .view-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }

        .table-footer { padding:.75rem 1.25rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; text-align:left; }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; text-decoration:none; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); box-shadow:0 4px 14px rgba(27,94,140,.35); transform:translateY(-1px); }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(3),
          .table td:nth-child(3),
          .table th:nth-child(4),
          .table td:nth-child(4),
          .table th:nth-child(6),
          .table td:nth-child(6) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}

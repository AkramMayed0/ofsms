'use client';

/**
 * page.jsx
 * Route:  /governorates  (GM only)
 *
 * Shows all Yemeni governorates with orphan/family counts.
 * Each row has Export PDF and Export Excel buttons.
 *
 * FIX: downloadBlob uses '/reports/governorate/:id?format=...'
 * NOT '/api/reports/...' — api instance baseURL already includes /api.
 *
 * APIs:
 *   GET /api/governorates                     → list all governorates
 *   GET /api/governorates/:id/orphans         → orphan counts per gov
 *   GET /api/reports/governorate/:id?format=  → download report
 */

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Download helper ───────────────────────────────────────────────────────────
// path must be relative to api.baseURL e.g. '/reports/governorate/1?format=pdf'
const downloadBlob = async (path, filename) => {
  const response = await api.get(path, { responseType: 'blob' });
  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

// ── Extract error from blob response ─────────────────────────────────────────
const extractBlobError = async (err) => {
  if (err.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      return JSON.parse(text).error;
    } catch { /* ignore */ }
  }
  return err.response?.data?.error || err.message || 'فشل التنزيل';
};

// ── Export buttons for a single row ──────────────────────────────────────────
function ExportButtons({ gov, onError }) {
  const [busy, setBusy] = useState(null); // null | 'pdf' | 'excel'

  const handleExport = async (format) => {
    setBusy(format);
    onError('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const slug     = gov.name_en.replace(/\s+/g, '-');
      const date     = new Date().toISOString().split('T')[0];
      const filename = `governorate-${slug}-${date}.${ext}`;
      // ✅ FIXED: no /api prefix
      await downloadBlob(`/reports/governorate/${gov.id}?format=${format}`, filename);
    } catch (err) {
      const msg = await extractBlobError(err);
      onError(`${gov.name_ar}: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="export-btns">
      <button
        className="btn-excel"
        onClick={() => handleExport('excel')}
        disabled={!!busy}
        title={`تصدير ${gov.name_ar} كـ Excel`}
      >
        {busy === 'excel' ? <span className="spin spin-dark" /> : '📊'}
        <span>Excel</span>
      </button>
      <button
        className="btn-pdf"
        onClick={() => handleExport('pdf')}
        disabled={!!busy}
        title={`تصدير ${gov.name_ar} كـ PDF`}
      >
        {busy === 'pdf' ? <span className="spin" /> : '📄'}
        <span>PDF</span>
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GovernoratesPage() {
  const [governorates, setGovernorates] = useState([]);
  const [stats,        setStats]        = useState({}); // { [govId]: { total, under_sponsorship, gifted } }
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error,        setError]        = useState('');
  const [exportError,  setExportError]  = useState('');
  const [search,       setSearch]       = useState('');

  // Load governorates first, then load stats for each in parallel
  useEffect(() => {
    setLoading(true);
    api.get('/governorates')
      .then(({ data }) => {
        const govs = data.data || [];
        setGovernorates(govs);
        setLoading(false);

        // Load orphan summary for each governorate
        setStatsLoading(true);
        Promise.allSettled(
          govs.map(g =>
            api.get(`/governorates/${g.id}/orphans`)
              .then(res => ({ id: g.id, summary: res.data.summary }))
              .catch(() => ({ id: g.id, summary: null }))
          )
        ).then(results => {
          const map = {};
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.summary) {
              map[r.value.id] = r.value.summary;
            }
          });
          setStats(map);
        }).finally(() => setStatsLoading(false));
      })
      .catch(() => {
        setError('تعذّر تحميل بيانات المحافظات. يرجى تحديث الصفحة.');
        setLoading(false);
      });
  }, []);

  const filtered = governorates.filter(g =>
    !search ||
    g.name_ar.includes(search) ||
    g.name_en.toLowerCase().includes(search.toLowerCase())
  );

  // Totals
  const totalOrphans      = Object.values(stats).reduce((s, v) => s + (v?.total || 0), 0);
  const totalSponsored    = Object.values(stats).reduce((s, v) => s + (v?.under_sponsorship || 0), 0);
  const totalMonthlyValue = Object.values(stats).reduce((s, v) => s + (v?.total_monthly_value || 0), 0);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">🗺️ تحليلات المحافظات</h1>
            <p className="page-sub">
              عرض إحصائيات الأيتام لكل محافظة وتصدير التقارير
            </p>
          </div>
        </div>

        {/* Summary stats bar */}
        {!loading && !error && (
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">{governorates.length}</span>
              <span className="stat-lbl">محافظة</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">{statsLoading ? '…' : totalOrphans}</span>
              <span className="stat-lbl">إجمالي الأيتام</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">{statsLoading ? '…' : totalSponsored}</span>
              <span className="stat-lbl">تحت الكفالة</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">
                {statsLoading ? '…' : `${Number(totalMonthlyValue).toLocaleString('ar-YE')}`}
              </span>
              <span className="stat-lbl">ريال / شهر</span>
            </div>
          </div>
        )}

        {/* Export error */}
        {exportError && (
          <div className="export-err-banner">
            ⚠ {exportError}
            <button className="err-close" onClick={() => setExportError('')}>✕</button>
          </div>
        )}

        {/* Error */}
        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Search */}
        {!loading && !error && (
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-inp"
              placeholder="ابحث بالاسم العربي أو الإنجليزي…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        )}

        {/* Info note about export */}
        {!loading && !error && (
          <div className="info-box">
            <span>ℹ</span>
            <span>
              اضغط على <strong>Excel</strong> أو <strong>PDF</strong> بجانب أي محافظة لتنزيل تقرير كامل
              يشمل جميع الأيتام مع بيانات الكفالة والمندوبين.
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المحافظة</th>
                  <th>Governorate</th>
                  <th>الأيتام</th>
                  <th>تحت الكفالة</th>
                  <th>قيد المراجعة</th>
                  <th>موهوبون</th>
                  <th>إجمالي شهري</th>
                  <th>التصدير</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}><div className="skel" style={{ height: 14, width: j === 8 ? 120 : '80%', borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="th-num">#</th>
                  <th>المحافظة</th>
                  <th>Governorate</th>
                  <th className="th-center">الأيتام</th>
                  <th className="th-center">تحت الكفالة</th>
                  <th className="th-center">قيد المراجعة</th>
                  <th className="th-center">موهوبون 🌟</th>
                  <th className="th-center">إجمالي شهري (ر.ي)</th>
                  <th className="th-center">تصدير التقرير</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((gov, idx) => {
                  const s = stats[gov.id];
                  const total   = s?.total            || 0;
                  const spon    = s?.under_sponsorship || 0;
                  const review  = s?.under_review      || 0;
                  const gifted  = s?.gifted            || 0;
                  const monthly = s?.total_monthly_value || 0;
                  const hasData = !!s;

                  return (
                    <tr key={gov.id} className="trow">
                      <td className="td-num">{idx + 1}</td>
                      <td>
                        <div className="gov-name-ar">{gov.name_ar}</div>
                      </td>
                      <td>
                        <div className="gov-name-en">{gov.name_en}</div>
                      </td>
                      <td className="td-center">
                        {statsLoading && !hasData
                          ? <div className="skel" style={{ height: 14, width: 30, borderRadius: 4, margin: '0 auto' }} />
                          : <span className={`count-badge ${total > 0 ? 'count-has' : ''}`}>{total}</span>}
                      </td>
                      <td className="td-center">
                        {statsLoading && !hasData
                          ? <div className="skel" style={{ height: 14, width: 30, borderRadius: 4, margin: '0 auto' }} />
                          : <span className={`count-badge ${spon > 0 ? 'count-green' : ''}`}>{spon}</span>}
                      </td>
                      <td className="td-center">
                        {statsLoading && !hasData
                          ? <div className="skel" style={{ height: 14, width: 30, borderRadius: 4, margin: '0 auto' }} />
                          : <span className={`count-badge ${review > 0 ? 'count-yellow' : ''}`}>{review}</span>}
                      </td>
                      <td className="td-center">
                        {statsLoading && !hasData
                          ? <div className="skel" style={{ height: 14, width: 30, borderRadius: 4, margin: '0 auto' }} />
                          : <span className={`count-badge ${gifted > 0 ? 'count-gold' : ''}`}>{gifted}</span>}
                      </td>
                      <td className="td-center td-amount">
                        {statsLoading && !hasData
                          ? <div className="skel" style={{ height: 14, width: 80, borderRadius: 4, margin: '0 auto' }} />
                          : monthly > 0
                          ? Number(monthly).toLocaleString('ar-YE')
                          : <span className="zero">—</span>}
                      </td>
                      <td className="td-center">
                        <ExportButtons
                          gov={gov}
                          onError={setExportError}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* Empty search result */}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="td-empty">
                      لا توجد محافظات مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Totals footer */}
              {!statsLoading && filtered.length > 0 && (
                <tfoot>
                  <tr className="tfoot-row">
                    <td colSpan={3} className="tfoot-label">المجموع</td>
                    <td className="td-center tfoot-val">
                      {filtered.reduce((s, g) => s + (stats[g.id]?.total || 0), 0)}
                    </td>
                    <td className="td-center tfoot-val">
                      {filtered.reduce((s, g) => s + (stats[g.id]?.under_sponsorship || 0), 0)}
                    </td>
                    <td className="td-center tfoot-val">
                      {filtered.reduce((s, g) => s + (stats[g.id]?.under_review || 0), 0)}
                    </td>
                    <td className="td-center tfoot-val">
                      {filtered.reduce((s, g) => s + (stats[g.id]?.gifted || 0), 0)}
                    </td>
                    <td className="td-center tfoot-val td-amount">
                      {Number(filtered.reduce((s, g) => s + (stats[g.id]?.total_monthly_value || 0), 0)).toLocaleString('ar-YE')}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>

            <div className="table-footer">
              عرض {filtered.length} من {governorates.length} محافظة
            </div>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div className="legend">
            <span className="legend-item"><span className="count-badge count-green">0</span> تحت الكفالة</span>
            <span className="legend-item"><span className="count-badge count-yellow">0</span> قيد المراجعة</span>
            <span className="legend-item"><span className="count-badge count-gold">0</span> موهوبون</span>
            <span className="legend-item"><span className="count-badge count-has">0</span> إجمالي الأيتام</span>
          </div>
        )}

      </div>

      <style jsx>{`
        /* ── Layout ───────────────────────────────────────────────────── */
        .page {
          max-width: 1200px; margin: 0 auto; padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .page-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .page-title { font-size: 1.65rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        /* ── Stats bar ────────────────────────────────────────────────── */
        .stats-bar {
          display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          border-radius: 1rem; padding: 1.25rem 2rem;
        }
        .stat { display: flex; flex-direction: column; align-items: center; gap: .2rem; flex: 1; }
        .stat-num { font-size: 1.6rem; font-weight: 800; color: #fff; }
        .stat-lbl { font-size: .75rem; color: rgba(255,255,255,.7); font-weight: 500; white-space: nowrap; }
        .stat-div { width: 1px; align-self: stretch; background: rgba(255,255,255,.2); }

        /* ── Export error banner ──────────────────────────────────────── */
        .export-err-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .85rem; font-weight: 500;
        }
        .err-close {
          background: none; border: none; cursor: pointer; color: #b91c1c;
          font-size: .85rem; padding: 0 .25rem; flex-shrink: 0;
        }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .85rem 1rem; border-radius: .75rem; font-size: .85rem;
        }

        /* ── Search ───────────────────────────────────────────────────── */
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; right: .85rem; font-size: .9rem; pointer-events: none; }
        .search-inp {
          width: 100%; border: 1.5px solid #d1d5db; border-radius: .75rem;
          padding: .65rem .9rem .65rem 2.5rem; padding-right: 2.4rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .search-inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position: absolute; left: .75rem; background: none; border: none; cursor: pointer; color: #9ca3af; }

        /* ── Info box ─────────────────────────────────────────────────── */
        .info-box {
          display: flex; align-items: flex-start; gap: .65rem;
          background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .75rem;
          padding: .85rem 1rem; font-size: .82rem; color: #1d4ed8; line-height: 1.65;
        }

        /* ── Table ────────────────────────────────────────────────────── */
        .table-wrap {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 2px 8px rgba(27,94,140,.06);
        }
        .table { width: 100%; border-collapse: collapse; }
        .table thead tr { background: #0d3d5c; }
        .table th {
          padding: .85rem 1rem; text-align: right; font-size: .75rem;
          font-weight: 700; color: rgba(255,255,255,.85); white-space: nowrap;
        }
        .th-num { width: 40px; }
        .th-center { text-align: center !important; }
        .table td { padding: .8rem 1rem; font-size: .85rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .trow:hover { background: #f8fbff; }
        .trow:last-child td { border-bottom: none; }
        .td-num { color: #9ca3af; font-size: .75rem; font-weight: 600; }
        .td-center { text-align: center; }
        .td-amount { font-weight: 700; color: #1B5E8C; font-size: .82rem; }
        .td-empty { text-align: center; padding: 3rem; color: #9ca3af; font-size: .88rem; }
        .zero { color: #d1d5db; }

        /* Gov name cells */
        .gov-name-ar { font-size: .9rem; font-weight: 700; color: #0d3d5c; }
        .gov-name-en { font-size: .78rem; color: #6b7a8d; direction: ltr; text-align: left; }

        /* Count badges */
        .count-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 28px; height: 24px; padding: 0 .5rem;
          border-radius: 2rem; font-size: .75rem; font-weight: 700;
          background: #f3f4f6; color: #9ca3af;
        }
        .count-has    { background: #eff6ff; color: #1d4ed8; }
        .count-green  { background: #ecfdf5; color: #059669; }
        .count-yellow { background: #fffbeb; color: #d97706; }
        .count-gold   { background: #fefce8; color: #ca8a04; }

        /* Table footer row */
        .tfoot-row { background: #f8fafc; border-top: 2px solid #e5eaf0; }
        .tfoot-label { font-size: .82rem; font-weight: 800; color: #0d3d5c; padding: .85rem 1rem; }
        .tfoot-val { font-size: .88rem; font-weight: 800; color: #0d3d5c; }

        .table-footer { padding: .75rem 1rem; font-size: .78rem; color: #9ca3af; border-top: 1px solid #f0f4f8; }

        /* ── Export buttons ───────────────────────────────────────────── */
        .export-btns { display: flex; align-items: center; gap: .4rem; justify-content: center; }
        .btn-excel {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .35rem .7rem; border: 1.5px solid #6ee7b7;
          background: #ecfdf5; color: #065f46;
          border-radius: .5rem; font-family: 'Cairo', sans-serif;
          font-size: .75rem; font-weight: 700; cursor: pointer; transition: all .15s;
          white-space: nowrap;
        }
        .btn-excel:hover:not(:disabled) { background: #d1fae5; border-color: #10b981; }
        .btn-excel:disabled { opacity: .5; cursor: not-allowed; }
        .btn-pdf {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .35rem .7rem; border: none;
          background: #1B5E8C; color: #fff;
          border-radius: .5rem; font-family: 'Cairo', sans-serif;
          font-size: .75rem; font-weight: 700; cursor: pointer; transition: all .15s;
          white-space: nowrap;
        }
        .btn-pdf:hover:not(:disabled) { background: #134569; }
        .btn-pdf:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Legend ───────────────────────────────────────────────────── */
        .legend {
          display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: center;
          padding: .75rem 1rem; background: #f9fafb; border: 1px solid #e5eaf0;
          border-radius: .75rem;
        }
        .legend-item { display: flex; align-items: center; gap: .5rem; font-size: .78rem; color: #6b7280; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .skel {
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 12px; height: 12px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        .spin-dark { border-color: rgba(0,0,0,.15); border-top-color: #065f46; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .table th:nth-child(7), .table td:nth-child(7),
          .table th:nth-child(8), .table td:nth-child(8) { display: none; }
        }
        @media (max-width: 640px) {
          .stats-bar { flex-direction: column; gap: .75rem; }
          .stat-div { width: 100%; height: 1px; align-self: auto; }
        }
      `}</style>
    </AppShell>
  );
}

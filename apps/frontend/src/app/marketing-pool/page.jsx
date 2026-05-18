'use client';

/**
 * page.jsx
 * Route:  /marketing-pool  (GM only)
 *
 * Shows all orphans + families with status = under_marketing.
 * Clicking a row navigates to the profile where a GM can assign a sponsor.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, User, Users, Download } from 'lucide-react';

import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".3">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, count, color }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '.6rem 1.1rem',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        fontFamily: "'Cairo', sans-serif",
        minWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color }}>
        {count}
      </span>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      {[80, 50, 70, 90, 60].map((w, i) => (
        <td key={i}><div className="skel-cell" style={{ width: `${w}%` }} /></td>
      ))}
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketingPoolPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [govFilter, setGovFilter] = useState('');
  const [giftedFilter, setGiftedFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [oRes, fRes, gRes] = await Promise.all([
        api.get('/orphans/marketing'),
        api.get('/families/marketing'),
        api.get('/governorates').catch(() => ({ data: { data: [] } })),
      ]);

      const orphans = (oRes.data.orphans || []).map(o => ({
        id: o.id,
        type: 'orphan',
        name: o.full_name,
        age: calcAge(o.date_of_birth),
        governorate: o.governorate_ar || '—',
        governorateId: o.governorate_id,
        agent: o.agent_name || '—',
        agent_id: o.agent_id,
        isGifted: o.is_gifted,
        addedAt: o.created_at,
      }));

      const families = (fRes.data.families || []).map(f => ({
        id: f.id,
        type: 'family',
        name: f.family_name,
        age: `${f.member_count || '—'} فرد`,
        governorate: f.governorate_ar || '—',
        governorateId: f.governorate_id,
        agent: f.agent_name || '—',
        agent_id: f.agent_id,
        isGifted: false,
        addedAt: f.created_at,
      }));

      setItems([...orphans, ...families].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)));
      setGovernorates(gRes.data.data || []);
    } catch {
      setError('تعذّر تحميل قائمة التسويق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.name?.includes(search) ||
      item.governorate?.includes(search) ||
      item.agent?.includes(search);
    const matchType = filterType === 'all' || item.type === filterType;
    const matchGov = !govFilter || item.governorate === govFilter;
    const matchGifted = !giftedFilter || String(item.isGifted) === giftedFilter;
    return matchSearch && matchType && matchGov && matchGifted;
  });
  const itemKey = (item) => `${item.type}:${item.id}`;
  const allFilteredSelected = filtered.length > 0
    && filtered.every(item => selectedItems.includes(itemKey(item)));

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleRowClick = (item) => {
    if (item.type === 'orphan') {
      router.push(`/orphans/${item.id}`);
    } else {
      router.push(`/families/${item.id}`);
    }
  };

  const toggleItem = (item) => {
    const key = itemKey(item);
    setSelectedItems((current) =>
      current.includes(key) ? current.filter((selectedKey) => selectedKey !== key) : [...current, key]
    );
  };

  const toggleFilteredItems = () => {
    if (allFilteredSelected) {
      setSelectedItems((current) => current.filter((key) => !filtered.some(item => itemKey(item) === key)));
      return;
    }
    setSelectedItems((current) => Array.from(new Set([...current, ...filtered.map(itemKey)])));
  };

  const exportSelected = async () => {
    if (selectedItems.length === 0) return;
    setExporting(true);
    setError('');
    try {
      for (const selectedKey of selectedItems) {
        const [type, id] = selectedKey.split(':');
        const item = items.find(i => i.type === type && i.id === id);
        const res = await api.get(`/reports/${type}/${id}/pdf`, { responseType: 'blob' });
        const safeName = (item?.name || id).replace(/[\\/:*?"<>|]/g, '-');
        downloadBlob(res.data, `${type}-${safeName}.pdf`);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch {
      setError('تعذّر تصدير ملفات PDF المحددة');
    } finally {
      setExporting(false);
    }
  };

  const orphanCount = items.filter(i => i.type === 'orphan').length;
  const familyCount = items.filter(i => i.type === 'family').length;
  const hasActiveFilters = search || filterType !== 'all' || govFilter || giftedFilter;

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setGovFilter('');
    setGiftedFilter('');
  };

  return (
    <AppShell>
      <div className="orphans-page" dir="rtl">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">مجمع التسويق</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `جميع الحالات بانتظار كافل`}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={load} title="تحديث">
              <IconRefresh />
            </button>
          </div>
        </div>

        {/* ── Stat pills ──────────────────────────────────────────── */}
        {!loading && items.length > 0 && (
          <div className="stat-pills">
            <StatPill label="الإجمالي" count={items.length} color="#1B5E8C" />
            <StatPill label="أيتام" count={orphanCount} color="#3B82F6" />
            <StatPill label="أسر" count={familyCount} color="#10B981" />
          </div>
        )}

        {/* ── Filters bar ─────────────────────────────────────────── */}
        <div className="filters-bar">
          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              className="search-inp"
              placeholder="ابحث بالاسم أو المحافظة أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}><X size={16} /></button>
            )}
          </div>

          {/* Type filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">الكل (أيتام + أسر)</option>
              <option value="orphan">الأيتام فقط <User size={18} /></option>
              <option value="family">الأسر فقط <Users size={18} /></option>
            </select>
          </div>

          {/* Governorate filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
            >
              <option value="">جميع المحافظات</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.name_ar}>{g.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Gifted filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={giftedFilter}
              onChange={(e) => setGiftedFilter(e.target.value)}
            >
              <option value="">الكل (موهوب + عادي)</option>
              <option value="true">الموهوبون فقط ⭐</option>
              <option value="false">غير الموهوبين</option>
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              مسح الفلاتر <X size={16} />
            </button>
          )}

          <button
            className="btn-export-selected"
            onClick={exportSelected}
            disabled={selectedItems.length === 0 || exporting}
            title="تصدير ملف PDF منفصل لكل مستفيد محدد"
          >
            <Download size={16} />
            {exporting ? 'جارٍ التصدير…' : `Export (${selectedItems.length})`}
          </button>
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">
            <AlertTriangle size={18} /> {error}
            <button onClick={load} className="retry-btn">إعادة المحاولة</button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="table-card">
          <div className="table-scroll">
            <table className="orphans-table">
              <thead>
                <tr>
                  <th className="select-col">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      disabled={filtered.length === 0}
                      onChange={toggleFilteredItems}
                      aria-label="تحديد كل المستفيدين الظاهرين"
                    />
                  </th>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>المحافظة</th>
                  <th>العمر / الأفراد</th>
                  <th>المندوب</th>
                  <th>تاريخ الاعتماد</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : !error && filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <IconEmpty />
                        <p className="empty-title">
                          {items.length === 0 ? 'لا يوجد مستفيدون بانتظار كافل' : 'لا توجد نتائج مطابقة'}
                        </p>
                        <p className="empty-sub">
                          {items.length === 0 ? 'جميع الحالات المعتمدة تم تعيين كفلاء لها' : 'جرّب تغيير الفلاتر أو مسحها'}
                        </p>
                        {hasActiveFilters && (
                          <button className="btn-clear-filters-sm" onClick={clearFilters}>
                            مسح الفلاتر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="data-row"
                      onClick={() => handleRowClick(item)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleRowClick(item)}
                      role="button"
                    >
                      <td className="select-col" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(itemKey(item))}
                          onChange={() => toggleItem(item)}
                          aria-label={`تحديد ${item.name}`}
                        />
                      </td>
                      {/* Name */}
                      <td>
                        <div className="name-cell">
                          <div className="avatar-sm">
                            {item.name?.[0] || '؟'}
                          </div>
                          <div className="name-info">
                            <span className="name-text">
                              {item.name}
                              {item.isGifted && (
                                <span className="gifted-tag" title="موهوب">
                                  <IconStar />
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td>
                        <span className={`badge ${item.type}`}>
                          {item.type === 'orphan' ? 'يتيم' : 'أسرة'}
                        </span>
                      </td>

                      {/* Governorate */}
                      <td>
                        <span className="gov-cell">{item.governorate}</span>
                      </td>

                      {/* Age / Members */}
                      <td>
                        <span className="age-cell">{item.age}</span>
                      </td>

                      {/* Agent */}
                      <td>
                        <span className="agent-cell">{item.agent}</span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="date-cell">
                          {item.addedAt ? new Date(item.addedAt).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span className="result-count">
                {filtered.length === items.length
                  ? `${items.length} مستفيد`
                  : `${filtered.length} من أصل ${items.length} مستفيد`}
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .orphans-page {
          max-width: 1100px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        /* ── Header ─────────────────────────────────────────────── */
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub   { font-size: .82rem; color: #9ca3af; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }

        .btn-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          background: #fff; color: #6b7280; cursor: pointer;
          transition: all .15s;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        /* ── Stat pills ─────────────────────────────────────────── */
        .stat-pills { display: flex; gap: .6rem; flex-wrap: wrap; }

        /* ── Filters bar ────────────────────────────────────────── */
        .filters-bar {
          display: flex; gap: .65rem; flex-wrap: wrap; align-items: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: .875rem;
          padding: .875rem 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }

        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none;
        }
        .search-inp {
          width: 100%; padding: .55rem 2.25rem .55rem 2rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          direction: rtl; transition: border-color .15s, box-shadow .15s;
        }
        .search-inp::placeholder { color: #c4cdd8; }
        .search-inp:focus { border-color: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.1); background: #fff; }
        .search-clear {
          position: absolute; left: .6rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #9ca3af; cursor: pointer;
          font-size: .8rem; padding: .2rem;
          transition: color .12s;
        }
        .search-clear:hover { color: #374151; }

        .filter-select-wrap { position: relative; }
        .filter-icon {
          position: absolute; right: .65rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none; z-index: 1;
        }
        .filter-select {
          padding: .55rem 2.1rem .55rem 1.75rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .82rem; color: #374151;
          background: #fafafa; outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left .6rem center;
          transition: border-color .15s;
        }
        .filter-select:focus { border-color: #1B5E8C; }

        .btn-clear-filters {
          padding: .5rem .875rem;
          background: #FEF2F2; border: 1px solid #FECACA; border-radius: .625rem;
          color: #B91C1C; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 600; cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .btn-clear-filters:hover { background: #FEE2E2; }
        .btn-export-selected {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .55rem .95rem;
          background: #0f766e; border: 1px solid #0f766e; border-radius: .625rem;
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 800; cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .btn-export-selected:hover:not(:disabled) { background: #0d665f; transform: translateY(-1px); }
        .btn-export-selected:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-clear-filters-sm {
          padding: .4rem .8rem; margin-top: 1rem;
          background: #fff; border: 1px solid #e5e7eb; border-radius: .5rem;
          color: #374151; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 600; cursor: pointer; transition: all .12s;
        }
        .btn-clear-filters-sm:hover { background: #f9fafb; border-color: #d1d5db; }

        /* ── Error ──────────────────────────────────────────────── */
        .error-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem;
        }
        .retry-btn {
          background: none; border: 1px solid #fca5a5; border-radius: .5rem;
          color: #b91c1c; padding: .3rem .75rem; cursor: pointer; font-size: .78rem;
          font-family: 'Cairo', sans-serif; font-weight: 600;
        }

        /* ── Table card ─────────────────────────────────────────── */
        .table-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .table-scroll { overflow-x: auto; }

        .orphans-table {
          width: 100%; border-collapse: collapse; font-size: .82rem;
          min-width: 760px;
        }

        .orphans-table thead tr {
          background: #f8fafc; border-bottom: 1.5px solid #e5eaf0;
        }
        .orphans-table th {
          padding: .75rem 1rem; font-size: .72rem; font-weight: 700;
          color: #9ca3af; text-align: right; white-space: nowrap;
          letter-spacing: .04em; text-transform: uppercase;
        }
        .select-col {
          width: 46px; text-align: center !important;
        }
        .select-col input {
          width: 16px; height: 16px; cursor: pointer; accent-color: #0f766e;
        }
        .select-placeholder { color: #cbd5e1; font-weight: 700; }

        /* ── Data rows ──────────────────────────────────────────── */
        .data-row {
          border-bottom: 1px solid #f1f5f9; cursor: pointer;
          transition: background .12s;
        }
        .data-row:last-child { border-bottom: none; }
        .data-row:hover { background: #f8fbff; }
        .data-row:focus { outline: none; background: #f0f7ff; }
        .data-row td { padding: .875rem 1rem; vertical-align: middle; }

        /* ── Name cell ──────────────────────────────────────────── */
        .name-cell { display: flex; align-items: center; gap: .625rem; }
        .avatar-sm {
          width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-size: .78rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .name-info { display: flex; flex-direction: column; }
        .name-text {
          font-size: .875rem; font-weight: 700; color: #0d3d5c;
          display: flex; align-items: center; gap: .3rem;
        }
        .gifted-tag {
          color: #D97706; display: inline-flex; align-items: center;
          flex-shrink: 0;
        }

        /* ── Other cells ────────────────────────────────────────── */
        .age-cell      { font-weight: 600; color: #374151; }
        .gov-cell      { color: #374151; }
        .agent-cell    { color: #6b7280; font-size: .78rem; }
        .date-cell     { color: #9ca3af; font-size: .75rem; white-space: nowrap; }

        .badge {
          display: inline-flex; padding: .2rem .65rem; border-radius: 2rem;
          font-size: .72rem; font-weight: 700;
        }
        .badge.orphan { background: #dbeafe; color: #1d4ed8; }
        .badge.family { background: #dcfce7; color: #15803d; }

        /* ── Table Footer ───────────────────────────────────────── */
        .table-footer {
          padding: .85rem 1.25rem; background: #fff;
          border-top: 1px solid #f0f4f8; display: flex; align-items: center;
        }
        .result-count {
          font-size: .78rem; font-weight: 600; color: #9ca3af;
        }

        /* ── Empty State ────────────────────────────────────────── */
        .empty-state { padding: 4rem 2rem; text-align: center; color: #9ca3af; display: flex; flex-direction: column; align-items: center; }
        .empty-title { font-size: 1rem; font-weight: 700; color: #374151; margin: .75rem 0 .4rem; }
        .empty-sub { font-size: .85rem; margin: 0; }

        /* ── Skeleton ───────────────────────────────────────────── */
        .skeleton-row td { padding: 1rem; border-bottom: 1px solid #f8fafc; }
        .skel-cell {
          height: 16px; border-radius: 4px;
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </AppShell>
  );
}

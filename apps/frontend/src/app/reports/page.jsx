'use client';

/**
 * Route: /reports  (GM + Supervisor + Finance)
 *
 * Tabs:
 *   1. كشوف الصرف  — select one or more → export PDF / Excel
 *   2. المحافظات   — select one → export orphan list PDF / Excel
 *
 * All styles are inline JS objects to avoid styled-jsx cross-component issues.
 * Fully responsive (stacks on mobile).
 */

import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Status labels ─────────────────────────────────────────────────────────────
const DISB_STATUS = {
  draft:               { label: 'مسودة',        color: '#92400E', bg: '#FEF3C7' },
  supervisor_approved: { label: 'اعتمد المشرف', color: '#1E40AF', bg: '#EFF6FF' },
  finance_approved:    { label: 'اعتمد المالي', color: '#5B21B6', bg: '#F5F3FF' },
  released:            { label: 'مُصدَر',        color: '#065F46', bg: '#ECFDF5' },
  rejected:            { label: 'مرفوض',         color: '#991B1B', bg: '#FEF2F2' },
};

const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ── Download helper ───────────────────────────────────────────────────────────
const downloadFile = async (url, filename, ext) => {
  const res  = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link    = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = `${filename}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// ── Reusable Export Action Bar ────────────────────────────────────────────────
function ExportBar({ selectedCount, onExportPdf, onExportExcel, pdfLoading, excelLoading, label }) {
  const busy = pdfLoading || excelLoading;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '.75rem',
      padding: '.75rem 1.1rem',
      background: selectedCount > 0 ? 'linear-gradient(90deg,#f0f7ff,#e8f4ff)' : '#f8fafc',
      borderBottom: '1px solid #e5eaf0', transition: 'background .2s',
    }}>
      <span style={{ fontSize: '.83rem', fontWeight: 700, color: selectedCount > 0 ? '#1B5E8C' : '#9ca3af' }}>
        {selectedCount > 0
          ? `✓ تم تحديد ${selectedCount} ${label}`
          : `اختر ${label} للتصدير`}
      </span>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {selectedCount > 1 && (
          <span style={{ fontSize: '.72rem', color: '#9ca3af', background: '#fff', border: '1px solid #e5eaf0', borderRadius: '.5rem', padding: '.2rem .6rem' }}>
            سيتم تنزيل {selectedCount} ملفات
          </span>
        )}
        <button
          onClick={onExportExcel}
          disabled={selectedCount === 0 || busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 700,
            border: '1.5px solid #86efac', borderRadius: '.625rem',
            background: selectedCount === 0 ? '#f9fafb' : '#f0fdf4',
            color: selectedCount === 0 ? '#9ca3af' : '#16a34a',
            cursor: selectedCount === 0 || busy ? 'not-allowed' : 'pointer',
            fontFamily: 'Cairo,sans-serif', transition: 'all .15s',
            opacity: busy && !excelLoading ? .5 : 1,
          }}
        >
          {excelLoading ? <MiniSpinner color="#16a34a" /> : '📊'}
          {excelLoading ? 'جارٍ التصدير…' : 'Excel'}
        </button>
        <button
          onClick={onExportPdf}
          disabled={selectedCount === 0 || busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            padding: '.5rem 1rem', fontSize: '.82rem', fontWeight: 700,
            border: '1.5px solid #fca5a5', borderRadius: '.625rem',
            background: selectedCount === 0 ? '#f9fafb' : '#fef2f2',
            color: selectedCount === 0 ? '#9ca3af' : '#dc2626',
            cursor: selectedCount === 0 || busy ? 'not-allowed' : 'pointer',
            fontFamily: 'Cairo,sans-serif', transition: 'all .15s',
            opacity: busy && !pdfLoading ? .5 : 1,
          }}
        >
          {pdfLoading ? <MiniSpinner color="#dc2626" /> : '📄'}
          {pdfLoading ? 'جارٍ التصدير…' : 'PDF'}
        </button>
      </div>
    </div>
  );
}

// ── MiniSpinner ───────────────────────────────────────────────────────────────
function MiniSpinner({ color = '#1B5E8C' }) {
  return (
    <span style={{
      display: 'inline-block', width: 13, height: 13, flexShrink: 0,
      border: `2px solid ${color}30`, borderTopColor: color,
      borderRadius: '50%', animation: 'rp-spin .7s linear infinite',
    }} />
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRows({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ height: 14, borderRadius: 4, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'rp-spin 1.4s infinite', width: `${60 + (i + j) * 7}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'error', onClose }) {
  const colors = type === 'success'
    ? { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' }
    : { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 2000, background: colors.bg, border: `1px solid ${colors.border}`,
      color: colors.text, borderRadius: '.75rem', padding: '.8rem 1.5rem',
      fontWeight: 600, fontSize: '.85rem', boxShadow: '0 4px 20px rgba(0,0,0,.12)',
      display: 'flex', alignItems: 'center', gap: '.75rem', animation: 'rp-fadein .25s ease',
      fontFamily: 'Cairo,sans-serif',
    }}>
      {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, fontWeight: 800, padding: 0, fontSize: '1rem', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ── Tab: Disbursements ────────────────────────────────────────────────────────
function DisbursementsTab() {
  const [lists, setLists]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    api.get('/disbursements')
      .then(({ data }) => setLists(data.lists || []))
      .catch(() => setToast({ msg: 'تعذّر تحميل كشوف الصرف', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = lists.filter(l => {
    const monthName = ARABIC_MONTHS[l.month] || '';
    const matchSearch = !search ||
      monthName.includes(search) ||
      String(l.year).includes(search) ||
      (l.created_by_name || '').includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedLists = lists.filter(l => selected.has(l.id));

  const doExport = async (ext, setLoading) => {
    setLoading(true);
    try {
      for (const list of selectedLists) {
        const monthName = ARABIC_MONTHS[list.month] || list.month;
        await downloadFile(
          `/reports/disbursement/${list.id}/${ext}`,
          `كشف-صرف-${monthName}-${list.year}`,
          ext
        );
        // Small delay between multiple downloads
        if (selectedLists.length > 1) await new Promise(r => setTimeout(r, 600));
      }
      setToast({ msg: `✅ تم تصدير ${selectedLists.length} ملف بنجاح`, type: 'success' });
    } catch {
      setToast({ msg: 'فشل التصدير — تأكد من صلاحياتك وحاول مجدداً', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f0f4f8' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
          <input
            style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.55rem .85rem .55rem 2rem', paddingRight: '2.2rem', fontSize: '.83rem', fontFamily: 'Cairo,sans-serif', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
            placeholder="ابحث بالشهر أو السنة أو المُنشئ…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', left: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
          {[{ key: 'all', label: 'الكل' }, ...Object.entries(DISB_STATUS).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
            <button key={key}
              onClick={() => setStatusFilter(key)}
              style={{ padding: '.35rem .75rem', border: `1.5px solid ${statusFilter === key ? '#1B5E8C' : '#e5eaf0'}`, borderRadius: '2rem', fontSize: '.73rem', fontWeight: 600, color: statusFilter === key ? '#fff' : '#6b7280', background: statusFilter === key ? '#1B5E8C' : '#fff', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', transition: 'all .15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Export bar */}
      <ExportBar
        selectedCount={selected.size}
        label="كشف صرف"
        pdfLoading={pdfLoading}
        excelLoading={excelLoading}
        onExportPdf={() => doExport('pdf', setPdfLoading)}
        onExportExcel={() => doExport('xlsx', setExcelLoading)}
      />

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ width: 44, padding: '.75rem 1rem', textAlign: 'center', borderBottom: '2px solid #e5eaf0' }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1B5E8C', cursor: 'pointer' }}
                  checked={selected.size === filtered.length && filtered.length > 0}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                  onChange={toggleAll} />
              </th>
              {['الفترة', 'الحالة', 'المستفيدون', 'الإجمالي', 'أنشأه', 'تاريخ الإنشاء'].map(h => (
                <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'right', fontSize: '.73rem', fontWeight: 700, color: '#6b7a8d', whiteSpace: 'nowrap', borderBottom: '2px solid #e5eaf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows count={5} /> :
             filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>
                {lists.length === 0 ? '📭 لا توجد كشوف صرف بعد' : '🔍 لا توجد نتائج مطابقة'}
              </td></tr>
            ) : filtered.map((list, idx) => {
              const cfg  = DISB_STATUS[list.status] || DISB_STATUS.draft;
              const isSel = selected.has(list.id);
              return (
                <tr key={list.id}
                  onClick={() => toggle(list.id)}
                  style={{ background: isSel ? '#f0f7ff' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fbff'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                >
                  <td style={{ textAlign: 'center', padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}
                    onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1B5E8C', cursor: 'pointer' }}
                      checked={isSel} onChange={() => toggle(list.id)} />
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}>
                    <div style={{ fontWeight: 700, color: '#0d3d5c', fontSize: '.87rem' }}>
                      {ARABIC_MONTHS[list.month]} {list.year}
                    </div>
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: '2rem', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', color: '#6b7280', fontSize: '.82rem' }}>
                    {parseInt(list.total_items || 0)} مستفيد
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', fontWeight: 700, color: '#1B5E8C', fontSize: '.82rem' }}>
                    {parseFloat(list.total_amount || 0).toLocaleString('ar-YE')} ر.ي
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', color: '#6b7280', fontSize: '.8rem' }}>
                    {list.created_by_name || '—'}
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', color: '#9ca3af', fontSize: '.77rem', whiteSpace: 'nowrap' }}>
                    {list.created_at ? new Date(list.created_at).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!loading && (
        <div style={{ padding: '.6rem 1rem', fontSize: '.75rem', color: '#9ca3af', borderTop: '1px solid #f0f4f8', background: '#fafafa', flexShrink: 0 }}>
          {filtered.length} كشف{selected.size > 0 ? ` · ${selected.size} مختار` : ''}
        </div>
      )}
    </div>
  );
}

// ── Tab: Governorates ─────────────────────────────────────────────────────────
function GovernoratesTab() {
  const [govs, setGovs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch]     = useState('');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    Promise.all([api.get('/governorates'), api.get('/dashboard/gm')])
      .then(([govsRes, dashRes]) => {
        const stats = dashRes.data.orphans_per_governorate || [];
        const merged = (govsRes.data.data || []).map(g => {
          const stat = stats.find(s => s.governorate_ar === g.name_ar);
          return { id: g.id, name_ar: g.name_ar, name_en: g.name_en, count: stat ? parseInt(stat.count) : 0 };
        }).sort((a, b) => b.count - a.count);
        setGovs(merged);
      })
      .catch(() => setToast({ msg: 'تعذّر تحميل المحافظات', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = govs.filter(g =>
    !search || g.name_ar.includes(search) || g.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const withOrphans = filtered.filter(g => g.count > 0);
    if (selected.size === withOrphans.length && withOrphans.length > 0) setSelected(new Set());
    else setSelected(new Set(withOrphans.map(g => g.id)));
  };

  const selectedGovs = govs.filter(g => selected.has(g.id));
  const withOrphans  = filtered.filter(g => g.count > 0);
  const maxCount     = Math.max(...govs.map(g => g.count), 1);

  const doExport = async (ext, setLoading) => {
    setLoading(true);
    try {
      for (const gov of selectedGovs) {
        await downloadFile(
          `/reports/governorate/${gov.id}/${ext}`,
          `أيتام-${gov.name_ar}`,
          ext
        );
        if (selectedGovs.length > 1) await new Promise(r => setTimeout(r, 600));
      }
      setToast({ msg: `✅ تم تصدير ${selectedGovs.length} تقرير بنجاح`, type: 'success' });
    } catch {
      setToast({ msg: 'فشل التصدير — تأكد من صلاحياتك وحاول مجدداً', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #f0f4f8' }}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <span style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
          <input
            style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: '.625rem', padding: '.55rem .85rem .55rem 2rem', paddingRight: '2.2rem', fontSize: '.83rem', fontFamily: 'Cairo,sans-serif', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
            placeholder="ابحث باسم المحافظة…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', left: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
          )}
        </div>
      </div>

      {/* Export bar */}
      <ExportBar
        selectedCount={selected.size}
        label="محافظة"
        pdfLoading={pdfLoading}
        excelLoading={excelLoading}
        onExportPdf={() => doExport('pdf', setPdfLoading)}
        onExportExcel={() => doExport('xlsx', setExcelLoading)}
      />

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ width: 44, padding: '.75rem 1rem', textAlign: 'center', borderBottom: '2px solid #e5eaf0' }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1B5E8C', cursor: 'pointer' }}
                  checked={selected.size === withOrphans.length && withOrphans.length > 0}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < withOrphans.length; }}
                  onChange={toggleAll} />
              </th>
              {['المحافظة', 'بالإنجليزية', 'عدد الأيتام', 'النسبة'].map(h => (
                <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'right', fontSize: '.73rem', fontWeight: 700, color: '#6b7a8d', whiteSpace: 'nowrap', borderBottom: '2px solid #e5eaf0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows count={8} /> :
             filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>🔍 لا توجد نتائج</td></tr>
            ) : filtered.map((gov, idx) => {
              const isSel     = selected.has(gov.id);
              const hasOrphans = gov.count > 0;
              const pct       = Math.round((gov.count / maxCount) * 100);
              return (
                <tr key={gov.id}
                  onClick={() => hasOrphans && toggle(gov.id)}
                  style={{ background: isSel ? '#f0f7ff' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: hasOrphans ? 'pointer' : 'default', opacity: hasOrphans ? 1 : 0.45, transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSel && hasOrphans) e.currentTarget.style.background = '#f8fbff'; }}
                  onMouseLeave={e => { if (!isSel && hasOrphans) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                >
                  <td style={{ textAlign: 'center', padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}
                    onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1B5E8C', cursor: hasOrphans ? 'pointer' : 'not-allowed' }}
                      checked={isSel} disabled={!hasOrphans} onChange={() => hasOrphans && toggle(gov.id)} />
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', fontWeight: 700, color: '#0d3d5c' }}>
                    {gov.name_ar}
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', color: '#9ca3af', fontSize: '.78rem', direction: 'ltr', textAlign: 'left' }}>
                    {gov.name_en}
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}>
                    <span style={{ fontWeight: 800, color: hasOrphans ? '#1B5E8C' : '#9ca3af', fontSize: '.9rem' }}>
                      {gov.count}
                    </span>
                    {!hasOrphans && <span style={{ fontSize: '.7rem', color: '#9ca3af', marginRight: '.35rem' }}>— لا يوجد أيتام</span>}
                  </td>
                  <td style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f0f4f8', minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <div style={{ flex: 1, height: 7, background: '#f0f4f8', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isSel ? '#1B5E8C' : 'linear-gradient(90deg,#93c5fd,#60a5fa)', borderRadius: '999px', transition: 'width .4s ease' }} />
                      </div>
                      <span style={{ fontSize: '.7rem', color: '#9ca3af', minWidth: 28, textAlign: 'left' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && (
        <div style={{ padding: '.6rem 1rem', fontSize: '.75rem', color: '#9ca3af', borderTop: '1px solid #f0f4f8', background: '#fafafa', flexShrink: 0 }}>
          {filtered.length} محافظة{selected.size > 0 ? ` · ${selected.size} مختارة` : ''}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState('disbursements');

  const tabs = [
    { key: 'disbursements', label: 'كشوف الصرف',  icon: '💰', desc: 'تصدير كشوف الصرف الشهرية' },
    { key: 'governorates',  label: 'المحافظات',    icon: '📍', desc: 'تصدير تقارير الأيتام بالمحافظة' },
  ];

  return (
    <AppShell>
      <div dir="rtl" style={{ fontFamily: "'Cairo','Tajawal',sans-serif", height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Keyframes */}
        <style>{`
          @keyframes rp-spin   { to   { transform: rotate(360deg); } }
          @keyframes rp-fadein { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        `}</style>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d3d5c', margin: '0 0 .2rem' }}>التقارير والتصدير</h1>
            <p style={{ fontSize: '.83rem', color: '#6b7a8d', margin: 0 }}>اختر البيانات من الجدول ثم صدّرها بتنسيق PDF أو Excel</p>
          </div>
          {/* How-to tip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '.625rem', padding: '.5rem .85rem', fontSize: '.75rem', color: '#1d4ed8', fontWeight: 600 }}>
            <span>💡</span>
            <span>حدد صفاً أو أكثر ثم اضغط PDF أو Excel</span>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.5rem',
                padding: '.65rem 1.25rem',
                border: `2px solid ${tab === t.key ? '#1B5E8C' : '#e5eaf0'}`,
                borderRadius: '.875rem', fontFamily: 'Cairo,sans-serif', fontSize: '.85rem',
                fontWeight: 700, color: tab === t.key ? '#fff' : '#6b7280',
                background: tab === t.key ? '#1B5E8C' : '#fff',
                cursor: 'pointer', transition: 'all .15s',
                boxShadow: tab === t.key ? '0 2px 8px rgba(27,94,140,.2)' : 'none',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{t.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div>{t.label}</div>
                <div style={{ fontSize: '.68rem', fontWeight: 400, opacity: .8 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Table card */}
        <div style={{ flex: 1, background: '#fff', border: '1.5px solid #e5eaf0', borderRadius: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {tab === 'disbursements' && <DisbursementsTab />}
          {tab === 'governorates'  && <GovernoratesTab />}
        </div>

      </div>
    </AppShell>
  );
}